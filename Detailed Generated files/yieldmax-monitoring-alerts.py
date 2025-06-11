# ==================== DATA QUALITY MONITORING & ALERTING SYSTEM ====================

import asyncio
import time
import json
import statistics
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, asdict
from decimal import Decimal
import aiohttp
import pandas as pd
import numpy as np
from prometheus_client import Counter, Gauge, Histogram, Summary
import logging
from enum import Enum

# ==================== MONITORING METRICS ====================

# Prometheus metrics
data_accuracy_gauge = Gauge('yieldmax_data_accuracy', 'Data accuracy percentage', ['source'])
update_latency_histogram = Histogram('yieldmax_update_latency_seconds', 'Update latency distribution', 
                                   buckets=[1, 5, 10, 20, 30, 60, 120])
system_uptime_gauge = Gauge('yieldmax_system_uptime_percent', 'System uptime percentage')
data_points_processed = Counter('yieldmax_data_points_processed_total', 'Total data points processed', ['protocol', 'chain'])
errors_counter = Counter('yieldmax_errors_total', 'Total errors', ['type', 'severity'])
alert_counter = Counter('yieldmax_alerts_total', 'Total alerts triggered', ['type', 'severity'])

# ==================== DATA QUALITY MONITOR ====================

class DataQuality(Enum):
    EXCELLENT = "excellent"  # >99.5% accuracy
    GOOD = "good"           # >98% accuracy
    ACCEPTABLE = "acceptable"  # >95% accuracy
    POOR = "poor"           # <95% accuracy

@dataclass
class QualityMetrics:
    timestamp: int
    accuracy: float
    latency: float
    completeness: float
    consistency: float
    anomaly_count: int
    quality_score: float
    status: DataQuality

class DataQualityMonitor:
    """
    Comprehensive data quality monitoring system
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.metrics_history = []
        self.alert_manager = AlertManager()
        
        # Quality thresholds
        self.thresholds = {
            'accuracy': {
                'excellent': 0.995,
                'good': 0.98,
                'acceptable': 0.95,
                'alert': 0.95
            },
            'latency': {
                'excellent': 10,  # seconds
                'good': 20,
                'acceptable': 30,
                'alert': 30
            },
            'completeness': {
                'excellent': 0.99,
                'good': 0.95,
                'acceptable': 0.90,
                'alert': 0.90
            },
            'consistency': {
                'excellent': 0.99,
                'good': 0.97,
                'acceptable': 0.95,
                'alert': 0.95
            }
        }
        
        # Data validation rules
        self.validation_rules = {
            'apy_range': (0, 50),  # 0-50% APY
            'tvl_min': 100000,     # $100k minimum
            'utilization_range': (0, 100),
            'timestamp_freshness': 300,  # 5 minutes
            'block_delay_max': 50
        }
    
    async def monitor_continuously(self):
        """
        Main monitoring loop
        """
        self.logger.info("Starting data quality monitoring")
        
        while True:
            try:
                # Collect quality metrics
                metrics = await self.collect_quality_metrics()
                
                # Store metrics
                self.metrics_history.append(metrics)
                if len(self.metrics_history) > 10080:  # Keep 1 week of minute data
                    self.metrics_history.pop(0)
                
                # Update Prometheus metrics
                self.update_prometheus_metrics(metrics)
                
                # Check for quality issues
                await self.check_quality_thresholds(metrics)
                
                # Log current status
                self.logger.info(f"Data quality: {metrics.status.value} - "
                               f"Accuracy: {metrics.accuracy:.3f}, "
                               f"Latency: {metrics.latency:.1f}s")
                
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                self.logger.error(f"Monitoring error: {e}")
                errors_counter.labels(type='monitoring', severity='high').inc()
                await asyncio.sleep(60)
    
    async def collect_quality_metrics(self) -> QualityMetrics:
        """
        Collect comprehensive quality metrics
        """
        # Run quality checks concurrently
        accuracy_task = self.calculate_accuracy()
        latency_task = self.measure_latency()
        completeness_task = self.check_completeness()
        consistency_task = self.verify_consistency()
        anomaly_task = self.detect_anomalies()
        
        results = await asyncio.gather(
            accuracy_task,
            latency_task,
            completeness_task,
            consistency_task,
            anomaly_task
        )
        
        accuracy, latency, completeness, consistency, anomaly_count = results
        
        # Calculate overall quality score
        quality_score = self.calculate_quality_score(
            accuracy, latency, completeness, consistency
        )
        
        # Determine status
        status = self.determine_quality_status(quality_score)
        
        return QualityMetrics(
            timestamp=int(time.time()),
            accuracy=accuracy,
            latency=latency,
            completeness=completeness,
            consistency=consistency,
            anomaly_count=anomaly_count,
            quality_score=quality_score,
            status=status
        )
    
    async def calculate_accuracy(self) -> float:
        """
        Compare data from multiple sources to verify accuracy
        """
        try:
            # Get yield data from different sources
            chainlink_data = await self.fetch_chainlink_data()
            onchain_data = await self.fetch_onchain_data()
            api_data = await self.fetch_api_data()
            
            if not all([chainlink_data, onchain_data, api_data]):
                return 0.0
            
            # Compare data points
            total_comparisons = 0
            accurate_comparisons = 0
            
            for key in chainlink_data:
                if key in onchain_data and key in api_data:
                    chainlink_val = float(chainlink_data[key]['apy'])
                    onchain_val = float(onchain_data[key]['apy'])
                    api_val = float(api_data[key]['apy'])
                    
                    # Calculate median as truth
                    median_val = statistics.median([chainlink_val, onchain_val, api_val])
                    
                    # Check if all sources are within 1% of median
                    for val in [chainlink_val, onchain_val, api_val]:
                        total_comparisons += 1
                        if abs(val - median_val) / median_val < 0.01:
                            accurate_comparisons += 1
            
            accuracy = accurate_comparisons / total_comparisons if total_comparisons > 0 else 0
            
            # Update metric
            data_accuracy_gauge.labels(source='combined').set(accuracy)
            
            return accuracy
            
        except Exception as e:
            self.logger.error(f"Accuracy calculation error: {e}")
            return 0.0
    
    async def measure_latency(self) -> float:
        """
        Measure data update latency
        """
        try:
            # Create test transaction on testnet
            test_tx_hash = await self.create_test_transaction()
            
            # Measure time until it appears in our data
            start_time = time.time()
            max_wait = 120  # 2 minutes maximum
            
            while time.time() - start_time < max_wait:
                if await self.check_transaction_processed(test_tx_hash):
                    latency = time.time() - start_time
                    update_latency_histogram.observe(latency)
                    return latency
                
                await asyncio.sleep(1)
            
            # Timeout reached
            update_latency_histogram.observe(max_wait)
            return max_wait
            
        except Exception as e:
            self.logger.error(f"Latency measurement error: {e}")
            return 999.0  # High value to indicate error
    
    async def check_completeness(self) -> float:
        """
        Verify all expected data points are present
        """
        try:
            expected_data_points = self.get_expected_data_points()
            actual_data_points = await self.get_actual_data_points()
            
            missing_points = []
            
            for expected in expected_data_points:
                found = False
                for actual in actual_data_points:
                    if (expected['protocol'] == actual['protocol'] and
                        expected['chain'] == actual['chain']):
                        found = True
                        break
                
                if not found:
                    missing_points.append(expected)
            
            completeness = 1 - (len(missing_points) / len(expected_data_points))
            
            # Log missing data points
            if missing_points:
                self.logger.warning(f"Missing data points: {missing_points}")
            
            return completeness
            
        except Exception as e:
            self.logger.error(f"Completeness check error: {e}")
            return 0.0
    
    async def verify_consistency(self) -> float:
        """
        Check data consistency across time
        """
        try:
            # Get recent data history
            recent_data = await self.get_recent_data_history(hours=1)
            
            if not recent_data:
                return 1.0
            
            inconsistencies = 0
            total_checks = 0
            
            # Group by protocol and chain
            grouped = self.group_data_by_protocol_chain(recent_data)
            
            for key, data_points in grouped.items():
                if len(data_points) < 2:
                    continue
                
                # Sort by timestamp
                data_points.sort(key=lambda x: x['timestamp'])
                
                # Check for unrealistic changes
                for i in range(1, len(data_points)):
                    prev = data_points[i-1]
                    curr = data_points[i]
                    
                    total_checks += 1
                    
                    # APY shouldn't change more than 10% in 1 minute
                    apy_change = abs(curr['apy'] - prev['apy']) / prev['apy']
                    if apy_change > 0.1:
                        inconsistencies += 1
                        self.logger.warning(
                            f"Large APY change detected: {key} - "
                            f"{prev['apy']:.2f}% -> {curr['apy']:.2f}%"
                        )
                    
                    # TVL shouldn't change more than 20% in 1 minute
                    tvl_change = abs(curr['tvl'] - prev['tvl']) / prev['tvl']
                    if tvl_change > 0.2:
                        inconsistencies += 1
            
            consistency = 1 - (inconsistencies / total_checks) if total_checks > 0 else 1.0
            
            return consistency
            
        except Exception as e:
            self.logger.error(f"Consistency check error: {e}")
            return 0.0
    
    async def detect_anomalies(self) -> int:
        """
        Detect anomalous data patterns
        """
        anomalies = []
        
        try:
            current_data = await self.get_current_data()
            
            for data_point in current_data:
                # Check APY bounds
                if not self.validation_rules['apy_range'][0] <= data_point['apy'] <= self.validation_rules['apy_range'][1]:
                    anomalies.append({
                        'type': 'apy_out_of_range',
                        'data': data_point,
                        'message': f"APY {data_point['apy']}% outside valid range"
                    })
                
                # Check TVL minimum
                if data_point['tvl'] < self.validation_rules['tvl_min']:
                    anomalies.append({
                        'type': 'tvl_too_low',
                        'data': data_point,
                        'message': f"TVL ${data_point['tvl']} below minimum"
                    })
                
                # Check timestamp freshness
                age = time.time() - data_point['timestamp']
                if age > self.validation_rules['timestamp_freshness']:
                    anomalies.append({
                        'type': 'stale_data',
                        'data': data_point,
                        'message': f"Data {age:.0f}s old (max {self.validation_rules['timestamp_freshness']}s)"
                    })
            
            # Log anomalies
            for anomaly in anomalies:
                self.logger.warning(f"Anomaly detected: {anomaly['message']}")
            
            return len(anomalies)
            
        except Exception as e:
            self.logger.error(f"Anomaly detection error: {e}")
            return 0
    
    def calculate_quality_score(self, accuracy: float, latency: float, 
                               completeness: float, consistency: float) -> float:
        """
        Calculate overall quality score (0-1)
        """
        # Normalize latency (inverse relationship)
        normalized_latency = max(0, 1 - (latency / 60))  # 60s = 0 score
        
        # Weighted average
        weights = {
            'accuracy': 0.35,
            'latency': 0.25,
            'completeness': 0.20,
            'consistency': 0.20
        }
        
        score = (
            accuracy * weights['accuracy'] +
            normalized_latency * weights['latency'] +
            completeness * weights['completeness'] +
            consistency * weights['consistency']
        )
        
        return score
    
    def determine_quality_status(self, score: float) -> DataQuality:
        """
        Determine quality status based on score
        """
        if score >= 0.95:
            return DataQuality.EXCELLENT
        elif score >= 0.90:
            return DataQuality.GOOD
        elif score >= 0.80:
            return DataQuality.ACCEPTABLE
        else:
            return DataQuality.POOR
    
    async def check_quality_thresholds(self, metrics: QualityMetrics):
        """
        Check if metrics breach thresholds and trigger alerts
        """
        # Check accuracy
        if metrics.accuracy < self.thresholds['accuracy']['alert']:
            await self.alert_manager.create_alert(
                type='data_quality',
                severity='high',
                title='Data Accuracy Degraded',
                message=f'Data accuracy {metrics.accuracy:.1%} is below threshold {self.thresholds["accuracy"]["alert"]:.1%}',
                details={'metric': 'accuracy', 'value': metrics.accuracy}
            )
        
        # Check latency
        if metrics.latency > self.thresholds['latency']['alert']:
            await self.alert_manager.create_alert(
                type='data_quality',
                severity='medium',
                title='High Data Latency',
                message=f'Update latency {metrics.latency:.1f}s exceeds threshold {self.thresholds["latency"]["alert"]}s',
                details={'metric': 'latency', 'value': metrics.latency}
            )
        
        # Check completeness
        if metrics.completeness < self.thresholds['completeness']['alert']:
            await self.alert_manager.create_alert(
                type='data_quality',
                severity='high',
                title='Missing Data Points',
                message=f'Data completeness {metrics.completeness:.1%} is below threshold',
                details={'metric': 'completeness', 'value': metrics.completeness}
            )
    
    def update_prometheus_metrics(self, metrics: QualityMetrics):
        """
        Update Prometheus metrics for Grafana dashboards
        """
        data_accuracy_gauge.labels(source='overall').set(metrics.accuracy)
        system_uptime_gauge.set(self.calculate_uptime())

# ==================== ALERT MANAGER ====================

class AlertSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class Alert:
    id: str
    timestamp: int
    type: str
    severity: AlertSeverity
    title: str
    message: str
    details: Dict
    acknowledged: bool = False
    resolved: bool = False

class AlertManager:
    """
    Centralized alert management system
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.alerts = []
        self.alert_rules = self.load_alert_rules()
        self.notification_channels = self.setup_notification_channels()
        
        # Alert deduplication
        self.alert_fingerprints = {}
        self.dedup_window = 300  # 5 minutes
    
    def load_alert_rules(self) -> Dict:
        """
        Load alert configuration rules
        """
        return {
            'data_quality': {
                'cooldown': 300,
                'escalation_time': 1800,
                'auto_resolve': True
            },
            'yield_anomaly': {
                'cooldown': 600,
                'escalation_time': 3600,
                'auto_resolve': False
            },
            'gas_spike': {
                'cooldown': 180,
                'escalation_time': 900,
                'auto_resolve': True
            },
            'liquidity_crisis': {
                'cooldown': 60,
                'escalation_time': 300,
                'auto_resolve': False
            },
            'system_error': {
                'cooldown': 60,
                'escalation_time': 600,
                'auto_resolve': False
            }
        }
    
    def setup_notification_channels(self) -> Dict:
        """
        Configure notification channels
        """
        return {
            'slack': SlackNotifier(),
            'pagerduty': PagerDutyNotifier(),
            'email': EmailNotifier(),
            'webhook': WebhookNotifier()
        }
    
    async def create_alert(self, type: str, severity: str, title: str, 
                          message: str, details: Dict = None):
        """
        Create and dispatch a new alert
        """
        # Generate alert ID
        alert_id = f"{type}_{int(time.time())}_{hash(message) % 10000}"
        
        # Check for deduplication
        fingerprint = f"{type}:{title}"
        if fingerprint in self.alert_fingerprints:
            last_alert_time = self.alert_fingerprints[fingerprint]
            if time.time() - last_alert_time < self.dedup_window:
                self.logger.debug(f"Alert deduplicated: {fingerprint}")
                return
        
        # Create alert object
        alert = Alert(
            id=alert_id,
            timestamp=int(time.time()),
            type=type,
            severity=AlertSeverity(severity),
            title=title,
            message=message,
            details=details or {}
        )
        
        # Store alert
        self.alerts.append(alert)
        self.alert_fingerprints[fingerprint] = time.time()
        
        # Update metrics
        alert_counter.labels(type=type, severity=severity).inc()
        
        # Dispatch notifications
        await self.dispatch_notifications(alert)
        
        # Log alert
        self.logger.warning(f"Alert created: {title} - {message}")
        
        return alert
    
    async def dispatch_notifications(self, alert: Alert):
        """
        Send alert notifications based on severity and type
        """
        # Determine channels based on severity
        channels = self.get_notification_channels(alert.severity)
        
        # Send notifications concurrently
        tasks = []
        for channel_name in channels:
            if channel_name in self.notification_channels:
                channel = self.notification_channels[channel_name]
                tasks.append(channel.send(alert))
        
        await asyncio.gather(*tasks, return_exceptions=True)
    
    def get_notification_channels(self, severity: AlertSeverity) -> List[str]:
        """
        Determine which channels to use based on severity
        """
        if severity == AlertSeverity.CRITICAL:
            return ['pagerduty', 'slack', 'email']
        elif severity == AlertSeverity.HIGH:
            return ['slack', 'email']
        elif severity == AlertSeverity.MEDIUM:
            return ['slack']
        else:
            return ['webhook']
    
    async def acknowledge_alert(self, alert_id: str):
        """
        Acknowledge an alert
        """
        for alert in self.alerts:
            if alert.id == alert_id:
                alert.acknowledged = True
                self.logger.info(f"Alert acknowledged: {alert_id}")
                return True
        return False
    
    async def resolve_alert(self, alert_id: str):
        """
        Resolve an alert
        """
        for alert in self.alerts:
            if alert.id == alert_id:
                alert.resolved = True
                self.logger.info(f"Alert resolved: {alert_id}")
                return True
        return False
    
    def get_active_alerts(self) -> List[Alert]:
        """
        Get all active (unresolved) alerts
        """
        return [alert for alert in self.alerts if not alert.resolved]
    
    def get_alert_statistics(self) -> Dict:
        """
        Get alert statistics for monitoring
        """
        active_alerts = self.get_active_alerts()
        
        stats = {
            'total_alerts': len(self.alerts),
            'active_alerts': len(active_alerts),
            'by_severity': {},
            'by_type': {},
            'mttr': self.calculate_mttr()  # Mean Time To Resolution
        }
        
        # Count by severity
        for severity in AlertSeverity:
            count = sum(1 for alert in active_alerts if alert.severity == severity)
            stats['by_severity'][severity.value] = count
        
        # Count by type
        for alert in active_alerts:
            if alert.type not in stats['by_type']:
                stats['by_type'][alert.type] = 0
            stats['by_type'][alert.type] += 1
        
        return stats
    
    def calculate_mttr(self) -> float:
        """
        Calculate mean time to resolution
        """
        resolved_alerts = [alert for alert in self.alerts if alert.resolved]
        
        if not resolved_alerts:
            return 0.0
        
        resolution_times = []
        for alert in resolved_alerts:
            # Find resolution time (would need to track this separately)
            # For now, estimate based on alert age
            resolution_time = 300  # Placeholder
            resolution_times.append(resolution_time)
        
        return statistics.mean(resolution_times) if resolution_times else 0.0

# ==================== NOTIFICATION CHANNELS ====================

class SlackNotifier:
    """
    Slack notification channel
    """
    
    def __init__(self):
        self.webhook_url = os.environ.get('SLACK_WEBHOOK_URL')
        self.channel = os.environ.get('SLACK_CHANNEL', '#yieldmax-alerts')
    
    async def send(self, alert: Alert):
        """
        Send alert to Slack
        """
        if not self.webhook_url:
            return
        
        # Format message
        color = {
            AlertSeverity.CRITICAL: '#FF0000',
            AlertSeverity.HIGH: '#FF9900',
            AlertSeverity.MEDIUM: '#FFCC00',
            AlertSeverity.LOW: '#00FF00'
        }.get(alert.severity, '#808080')
        
        payload = {
            'channel': self.channel,
            'attachments': [{
                'color': color,
                'title': f"{alert.severity.value.upper()}: {alert.title}",
                'text': alert.message,
                'fields': [
                    {'title': k, 'value': str(v), 'short': True}
                    for k, v in alert.details.items()
                ],
                'footer': 'YieldMax Monitoring',
                'ts': alert.timestamp
            }]
        }
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(self.webhook_url, json=payload) as response:
                    if response.status != 200:
                        logging.error(f"Slack notification failed: {response.status}")
            except Exception as e:
                logging.error(f"Slack notification error: {e}")

class PagerDutyNotifier:
    """
    PagerDuty notification channel for critical alerts
    """
    
    def __init__(self):
        self.api_key = os.environ.get('PAGERDUTY_API_KEY')
        self.service_id = os.environ.get('PAGERDUTY_SERVICE_ID')
        self.api_url = 'https://api.pagerduty.com/incidents'
    
    async def send(self, alert: Alert):
        """
        Create PagerDuty incident for critical alerts
        """
        if not self.api_key or alert.severity != AlertSeverity.CRITICAL:
            return
        
        headers = {
            'Authorization': f'Token token={self.api_key}',
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.pagerduty+json;version=2'
        }
        
        payload = {
            'incident': {
                'type': 'incident',
                'title': alert.title,
                'service': {
                    'id': self.service_id,
                    'type': 'service_reference'
                },
                'body': {
                    'type': 'incident_body',
                    'details': alert.message
                },
                'urgency': 'high'
            }
        }
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(self.api_url, json=payload, headers=headers) as response:
                    if response.status != 201:
                        logging.error(f"PagerDuty notification failed: {response.status}")
            except Exception as e:
                logging.error(f"PagerDuty notification error: {e}")

class EmailNotifier:
    """
    Email notification channel
    """
    
    def __init__(self):
        self.smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        self.smtp_user = os.environ.get('SMTP_USER')
        self.smtp_pass = os.environ.get('SMTP_PASS')
        self.recipients = os.environ.get('ALERT_EMAILS', '').split(',')
    
    async def send(self, alert: Alert):
        """
        Send email notification
        """
        if not self.smtp_user or not self.recipients:
            return
        
        subject = f"[YieldMax {alert.severity.value.upper()}] {alert.title}"
        
        body = f"""
YieldMax Alert

Severity: {alert.severity.value.upper()}
Time: {datetime.fromtimestamp(alert.timestamp).strftime('%Y-%m-%d %H:%M:%S UTC')}

{alert.message}

Details:
{json.dumps(alert.details, indent=2)}

Alert ID: {alert.id}
        """
        
        # Send email asynchronously
        # Implementation depends on email library used
        pass

class WebhookNotifier:
    """
    Generic webhook notification channel
    """
    
    def __init__(self):
        self.webhook_urls = os.environ.get('WEBHOOK_URLS', '').split(',')
    
    async def send(self, alert: Alert):
        """
        Send alert to configured webhooks
        """
        if not self.webhook_urls:
            return
        
        payload = asdict(alert)
        
        async with aiohttp.ClientSession() as session:
            tasks = []
            for url in self.webhook_urls:
                if url:
                    tasks.append(
                        session.post(url, json=payload)
                    )
            
            await asyncio.gather(*tasks, return_exceptions=True)

# ==================== PERFORMANCE MONITORING ====================

class PerformanceMonitor:
    """
    Monitor system performance metrics
    """
    
    def __init__(self):
        self.metrics = {
            'request_duration': Summary('yieldmax_request_duration_seconds', 
                                      'Request duration', ['endpoint']),
            'active_connections': Gauge('yieldmax_active_connections', 
                                      'Active WebSocket connections'),
            'queue_size': Gauge('yieldmax_queue_size', 
                              'Processing queue size', ['queue']),
            'cache_hit_rate': Gauge('yieldmax_cache_hit_rate', 
                                  'Cache hit rate percentage')
        }
        
        self.performance_history = []
    
    async def collect_metrics(self):
        """
        Collect system performance metrics
        """
        while True:
            metrics = {
                'timestamp': int(time.time()),
                'cpu_usage': await self.get_cpu_usage(),
                'memory_usage': await self.get_memory_usage(),
                'disk_usage': await self.get_disk_usage(),
                'network_io': await self.get_network_io(),
                'db_connections': await self.get_db_connections(),
                'api_latency': await self.measure_api_latency()
            }
            
            self.performance_history.append(metrics)
            
            # Keep last 24 hours
            cutoff = time.time() - 86400
            self.performance_history = [
                m for m in self.performance_history 
                if m['timestamp'] > cutoff
            ]
            
            # Check for performance issues
            await self.check_performance_thresholds(metrics)
            
            await asyncio.sleep(60)
    
    async def check_performance_thresholds(self, metrics: Dict):
        """
        Check if performance metrics breach thresholds
        """
        thresholds = {
            'cpu_usage': 80,  # 80%
            'memory_usage': 85,  # 85%
            'disk_usage': 90,  # 90%
            'api_latency': 1000  # 1 second
        }
        
        alert_manager = AlertManager()
        
        for metric, threshold in thresholds.items():
            if metric in metrics and metrics[metric] > threshold:
                await alert_manager.create_alert(
                    type='performance',
                    severity='high' if metric == 'disk_usage' else 'medium',
                    title=f'High {metric.replace("_", " ").title()}',
                    message=f'{metric} is {metrics[metric]:.1f}, exceeding threshold of {threshold}',
                    details={'metric': metric, 'value': metrics[metric], 'threshold': threshold}
                )

# ==================== MAIN MONITORING SERVICE ====================

class YieldMaxMonitoringService:
    """
    Main monitoring service orchestrator
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.data_quality_monitor = DataQualityMonitor()
        self.alert_manager = AlertManager()
        self.performance_monitor = PerformanceMonitor()
    
    async def start(self):
        """
        Start all monitoring services
        """
        self.logger.info("Starting YieldMax Monitoring Service")
        
        # Start monitoring tasks
        tasks = [
            self.data_quality_monitor.monitor_continuously(),
            self.performance_monitor.collect_metrics(),
            self.run_health_checks(),
            self.cleanup_old_data()
        ]
        
        # Run all monitoring tasks concurrently
        await asyncio.gather(*tasks)
    
    async def run_health_checks(self):
        """
        Periodic health checks
        """
        while True:
            try:
                health_status = await self.check_system_health()
                
                if not health_status['healthy']:
                    await self.alert_manager.create_alert(
                        type='system_health',
                        severity='critical',
                        title='System Health Check Failed',
                        message='One or more system components are unhealthy',
                        details=health_status
                    )
                
                await asyncio.sleep(300)  # Every 5 minutes
                
            except Exception as e:
                self.logger.error(f"Health check error: {e}")
                await asyncio.sleep(300)
    
    async def check_system_health(self) -> Dict:
        """
        Comprehensive system health check
        """
        health = {
            'healthy': True,
            'components': {}
        }
        
        # Check database connectivity
        db_healthy = await self.check_database_health()
        health['components']['database'] = db_healthy
        if not db_healthy:
            health['healthy'] = False
        
        # Check external API connectivity
        api_healthy = await self.check_api_health()
        health['components']['external_apis'] = api_healthy
        if not api_healthy:
            health['healthy'] = False
        
        # Check blockchain RPC connectivity
        rpc_healthy = await self.check_rpc_health()
        health['components']['blockchain_rpc'] = rpc_healthy
        if not rpc_healthy:
            health['healthy'] = False
        
        return health
    
    async def cleanup_old_data(self):
        """
        Clean up old monitoring data
        """
        while True:
            try:
                # Clean up alerts older than 30 days
                cutoff = time.time() - (30 * 86400)
                self.alert_manager.alerts = [
                    alert for alert in self.alert_manager.alerts
                    if alert.timestamp > cutoff
                ]
                
                self.logger.info("Cleaned up old monitoring data")
                
                await asyncio.sleep(86400)  # Daily
                
            except Exception as e:
                self.logger.error(f"Cleanup error: {e}")
                await asyncio.sleep(86400)

# ==================== UTILITY FUNCTIONS ====================

def calculate_sla_metrics(uptime: float, accuracy: float, latency: float) -> Dict:
    """
    Calculate SLA compliance metrics
    """
    sla_targets = {
        'uptime': 0.999,  # 99.9%
        'accuracy': 0.995,  # 99.5%
        'latency': 30  # 30 seconds
    }
    
    compliance = {
        'uptime': uptime >= sla_targets['uptime'],
        'accuracy': accuracy >= sla_targets['accuracy'],
        'latency': latency <= sla_targets['latency'],
        'overall': all([
            uptime >= sla_targets['uptime'],
            accuracy >= sla_targets['accuracy'],
            latency <= sla_targets['latency']
        ])
    }
    
    return {
        'targets': sla_targets,
        'actual': {
            'uptime': uptime,
            'accuracy': accuracy,
            'latency': latency
        },
        'compliance': compliance,
        'sla_met': compliance['overall']
    }

# ==================== ENTRY POINT ====================

async def main():
    """
    Main entry point for monitoring service
    """
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Start monitoring service
    service = YieldMaxMonitoringService()
    await service.start()

if __name__ == "__main__":
    asyncio.run(main())
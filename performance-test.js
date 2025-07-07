/**
 * Performance Testing Utility
 * Measures and reports performance improvements
 */

class PerformanceTester {
    constructor() {
        this.metrics = {
            loadTime: 0,
            domContentLoaded: 0,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0,
            cumulativeLayoutShift: 0,
            firstInputDelay: 0,
            bundleSize: 0,
            cacheHitRate: 0
        };
        
        this.startTime = performance.now();
        this.setupMetricCollection();
    }

    setupMetricCollection() {
        // DOM Content Loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.metrics.domContentLoaded = performance.now() - this.startTime;
        });

        // Load Complete
        window.addEventListener('load', () => {
            this.metrics.loadTime = performance.now() - this.startTime;
            this.collectWebVitals();
            this.generateReport();
        });
    }

    collectWebVitals() {
        // First Contentful Paint
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
            if (fcpEntry) {
                this.metrics.firstContentfulPaint = fcpEntry.startTime;
            }
        }).observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.metrics.largestContentfulPaint = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Cumulative Layout Shift
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    this.metrics.cumulativeLayoutShift += entry.value;
                }
            }
        }).observe({ entryTypes: ['layout-shift'] });

        // First Input Delay
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
            }
        }).observe({ entryTypes: ['first-input'] });
    }

    measureBundleSize() {
        const resources = performance.getEntriesByType('resource');
        let totalSize = 0;
        
        resources.forEach(resource => {
            if (resource.name.includes('.js') || resource.name.includes('.css')) {
                totalSize += resource.transferSize || 0;
            }
        });
        
        this.metrics.bundleSize = totalSize;
        return totalSize;
    }

    measureCacheEfficiency() {
        const resources = performance.getEntriesByType('resource');
        let cachedResources = 0;
        let totalResources = resources.length;
        
        resources.forEach(resource => {
            if (resource.transferSize === 0 && resource.decodedBodySize > 0) {
                cachedResources++;
            }
        });
        
        this.metrics.cacheHitRate = (cachedResources / totalResources) * 100;
        return this.metrics.cacheHitRate;
    }

    generateReport() {
        this.measureBundleSize();
        this.measureCacheEfficiency();
        
        const report = {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            grades: this.calculateGrades(),
            recommendations: this.generateRecommendations()
        };

        console.group('🚀 Performance Report');
        console.log('📊 Core Metrics:');
        console.table(this.metrics);
        console.log('📈 Performance Grades:');
        console.table(report.grades);
        console.log('💡 Recommendations:');
        report.recommendations.forEach(rec => console.log(`• ${rec}`));
        console.groupEnd();

        return report;
    }

    calculateGrades() {
        const grades = {};
        
        // Load Time Grade
        if (this.metrics.loadTime < 1000) grades.loadTime = 'A+';
        else if (this.metrics.loadTime < 2000) grades.loadTime = 'A';
        else if (this.metrics.loadTime < 3000) grades.loadTime = 'B';
        else if (this.metrics.loadTime < 5000) grades.loadTime = 'C';
        else grades.loadTime = 'D';

        // First Contentful Paint Grade
        if (this.metrics.firstContentfulPaint < 1800) grades.fcp = 'Good';
        else if (this.metrics.firstContentfulPaint < 3000) grades.fcp = 'Needs Improvement';
        else grades.fcp = 'Poor';

        // Largest Contentful Paint Grade
        if (this.metrics.largestContentfulPaint < 2500) grades.lcp = 'Good';
        else if (this.metrics.largestContentfulPaint < 4000) grades.lcp = 'Needs Improvement';
        else grades.lcp = 'Poor';

        // Cumulative Layout Shift Grade
        if (this.metrics.cumulativeLayoutShift < 0.1) grades.cls = 'Good';
        else if (this.metrics.cumulativeLayoutShift < 0.25) grades.cls = 'Needs Improvement';
        else grades.cls = 'Poor';

        // Bundle Size Grade
        if (this.metrics.bundleSize < 100000) grades.bundleSize = 'Excellent';
        else if (this.metrics.bundleSize < 250000) grades.bundleSize = 'Good';
        else if (this.metrics.bundleSize < 500000) grades.bundleSize = 'Fair';
        else grades.bundleSize = 'Poor';

        return grades;
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.metrics.loadTime > 3000) {
            recommendations.push('Consider implementing lazy loading for non-critical resources');
        }
        
        if (this.metrics.bundleSize > 250000) {
            recommendations.push('Bundle size is large - consider code splitting and tree shaking');
        }
        
        if (this.metrics.cacheHitRate < 50) {
            recommendations.push('Improve caching strategy for better performance');
        }
        
        if (this.metrics.firstContentfulPaint > 2000) {
            recommendations.push('Optimize critical rendering path for faster FCP');
        }
        
        if (this.metrics.cumulativeLayoutShift > 0.1) {
            recommendations.push('Reduce layout shifts by setting dimensions for images and ads');
        }

        if (recommendations.length === 0) {
            recommendations.push('Great job! Your application performance is optimized');
        }

        return recommendations;
    }

    // Compare with baseline performance
    compareWithBaseline(baseline) {
        const comparison = {};
        
        Object.keys(this.metrics).forEach(key => {
            if (baseline[key] !== undefined) {
                const improvement = baseline[key] - this.metrics[key];
                const percentageImprovement = (improvement / baseline[key]) * 100;
                comparison[key] = {
                    baseline: baseline[key],
                    current: this.metrics[key],
                    improvement: improvement,
                    percentage: percentageImprovement.toFixed(2) + '%'
                };
            }
        });

        console.group('📈 Performance Comparison');
        console.table(comparison);
        console.groupEnd();

        return comparison;
    }
}

// Baseline metrics before optimization (example)
const BASELINE_METRICS = {
    loadTime: 4500,      // 4.5s before optimization
    domContentLoaded: 3200,
    firstContentfulPaint: 2800,
    largestContentfulPaint: 4000,
    bundleSize: 450000,  // 450KB before optimization
    cacheHitRate: 20
};

// Initialize performance testing
const performanceTester = new PerformanceTester();

// Export for manual testing
window.performanceTester = performanceTester;
window.testPerformance = () => performanceTester.generateReport();
window.comparePerformance = () => performanceTester.compareWithBaseline(BASELINE_METRICS);

export default PerformanceTester;
/**
 * Cognitive Status Provider for VS Code
 * 
 * Tracks and analyzes cognitive state indicators within the VS Code environment.
 */
export class CognitiveStatusProvider {
    private cognitiveHistory: Array<{
        timestamp: number;
        fi: number;
        context: string;
    }> = [];

    updateStatus(fi: number, context: string): void {
        this.cognitiveHistory.push({
            timestamp: Date.now(),
            fi,
            context
        });

        // Keep only last 100 entries
        if (this.cognitiveHistory.length > 100) {
            this.cognitiveHistory.shift();
        }
    }

    getCurrentStatus(): any {
        const latest = this.cognitiveHistory[this.cognitiveHistory.length - 1];
        if (!latest) {
            return { fi: 0, trend: 'stable', context: 'unknown' };
        }

        const trend = this.calculateTrend();
        return {
            fi: latest.fi,
            trend,
            context: latest.context,
            sessionLength: this.cognitiveHistory.length
        };
    }

    private calculateTrend(): string {
        if (this.cognitiveHistory.length < 3) return 'stable';
        
        const recent = this.cognitiveHistory.slice(-3);
        const avgRecent = recent.reduce((sum, item) => sum + item.fi, 0) / recent.length;
        const older = this.cognitiveHistory.slice(-6, -3);
        const avgOlder = older.reduce((sum, item) => sum + item.fi, 0) / older.length;
        
        if (avgRecent > avgOlder + 0.1) return 'increasing';
        if (avgRecent < avgOlder - 0.1) return 'decreasing';
        return 'stable';
    }
}
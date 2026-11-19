/**
 * Analytics and Chart.js integration
 * Visualizes lending trends, category distribution, and collection health.
 */

class AnalyticsManager {
  constructor() {
    this.categoryChart = null;
    this.trendChart = null;
  }

  renderCategoryChart(canvasId, categoryData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (this.categoryChart) {
      this.categoryChart.destroy();
      this.categoryChart = null;
    }

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);

    const colors = [
      '#4f46e5', '#06b6d4', '#10b981', '#f59e0b',
      '#ec4899', '#8b5cf6', '#64748b', '#ef4444'
    ];

    if (typeof Chart !== 'undefined') {
      const ctx = canvas.getContext('2d');
      this.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 2,
            borderColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 12,
                font: { family: 'Inter, system-ui, sans-serif', size: 11 },
                color: document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#475569'
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return ` ${context.label}: ${context.raw} copies`;
                }
              }
            }
          },
          cutout: '68%'
        }
      });
    } else {
      // Fallback HTML bar representation if CDN is unavailable offline
      const container = canvas.parentElement;
      container.innerHTML = `
        <div class="space-y-3 pt-2">
          ${labels.map((lbl, i) => `
            <div>
              <div class="flex justify-between text-xs font-medium mb-1">
                <span>${lbl}</span>
                <span>${data[i]} copies</span>
              </div>
              <div class="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div class="h-full rounded-full" style="width: ${(data[i] / Math.max(...data, 1) * 100)}%; background-color: ${colors[i % colors.length]}"></div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  renderTrendChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (this.trendChart) {
      this.trendChart.destroy();
      this.trendChart = null;
    }

    const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    const checkouts = [45, 52, 68, 79, 94, 118];
    const returns = [40, 48, 62, 75, 88, 102];

    if (typeof Chart !== 'undefined') {
      const ctx = canvas.getContext('2d');
      const isDark = document.documentElement.classList.contains('dark');
      const textColor = isDark ? '#94a3b8' : '#64748b';
      const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

      this.trendChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [
            {
              label: 'Checkouts',
              data: checkouts,
              backgroundColor: '#4f46e5',
              borderRadius: 6,
              barPercentage: 0.6
            },
            {
              label: 'Returns',
              data: returns,
              backgroundColor: '#10b981',
              borderRadius: 6,
              barPercentage: 0.6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              align: 'end',
              labels: {
                boxWidth: 12,
                font: { family: 'Inter, system-ui, sans-serif', size: 12 },
                color: textColor
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { size: 11 } }
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { size: 11 } }
            }
          }
        }
      });
    }
  }
}

window.analyticsManager = new AnalyticsManager();

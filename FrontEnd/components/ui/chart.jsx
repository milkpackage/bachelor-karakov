"use client"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Line, Bar, Doughnut } from "react-chartjs-2"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

// Define chart colors for light and dark modes
const chartColors = {
  light: {
    backgroundColor: [
      "rgba(255, 205, 86, 0.8)", // yellow
      "rgba(75, 192, 192, 0.8)", // green
      "rgba(54, 162, 235, 0.8)", // blue
      "rgba(153, 102, 255, 0.8)", // purple
      "rgba(255, 99, 132, 0.8)", // red
      "rgba(255, 159, 64, 0.8)", // orange
      "rgba(201, 203, 207, 0.8)", // gray
      "rgba(22, 199, 132, 0.8)", // teal
      "rgba(255, 0, 255, 0.8)", // magenta
    ],
    borderColor: [
      "rgb(255, 205, 86)",
      "rgb(75, 192, 192)",
      "rgb(54, 162, 235)",
      "rgb(153, 102, 255)",
      "rgb(255, 99, 132)",
      "rgb(255, 159, 64)",
      "rgb(201, 203, 207)",
      "rgb(22, 199, 132)",
      "rgb(255, 0, 255)",
    ],
    borderWidth: 1,
  },
  dark: {
    backgroundColor: [
      "rgba(255, 205, 86, 0.8)",
      "rgba(75, 192, 192, 0.8)",
      "rgba(54, 162, 235, 0.8)",
      "rgba(153, 102, 255, 0.8)",
      "rgba(255, 99, 132, 0.8)",
      "rgba(255, 159, 64, 0.8)",
      "rgba(201, 203, 207, 0.8)",
      "rgba(22, 199, 132, 0.8)",
      "rgba(255, 0, 255, 0.8)",
    ],
    borderColor: [
      "rgb(255, 205, 86)",
      "rgb(75, 192, 192)",
      "rgb(54, 162, 235)",
      "rgb(153, 102, 255)",
      "rgb(255, 99, 132)",
      "rgb(255, 159, 64)",
      "rgb(201, 203, 207)",
      "rgb(22, 199, 132)",
      "rgb(255, 0, 255)",
    ],
    borderWidth: 1,
  },
}

export const BarChart = ({ data, index, categories, colors, valueFormatter, className }) => {
  // Determine if we're in dark mode
  const isDarkMode =
    typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches

  // Get the appropriate color scheme
  const colorScheme = isDarkMode ? chartColors.dark : chartColors.light

  // Process data for Chart.js format
  const labels = data.map((item) => item[index])

  const datasets = categories.map((category, i) => ({
    label: category,
    data: data.map((item) => item[category]),
    backgroundColor: colorScheme.backgroundColor[i % colorScheme.backgroundColor.length],
    borderColor: colorScheme.borderColor[i % colorScheme.borderColor.length],
    borderWidth: colorScheme.borderWidth,
  }))

  const chartData = {
    labels,
    datasets,
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: isDarkMode ? "#e5e7eb" : "#374151",
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || ""
            if (label) {
              label += ": "
            }
            if (context.parsed.y !== null) {
              label += valueFormatter ? valueFormatter(context.parsed.y) : context.parsed.y
            }
            return label
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: isDarkMode ? "#e5e7eb" : "#374151",
        },
        grid: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
      },
      y: {
        ticks: {
          color: isDarkMode ? "#e5e7eb" : "#374151",
        },
        grid: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
      },
    },
  }

  return (
    <div className={className}>
      <Bar data={chartData} options={options} />
    </div>
  )
}

export const LineChart = ({
  data,
  index,
  categories,
  colors,
  valueFormatter,
  className,
  showLegend = true,
  yAxisWidth,
  showAnimation = true,
}) => {
  // Determine if we're in dark mode
  const isDarkMode =
    typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches

  // Get the appropriate color scheme
  const colorScheme = isDarkMode ? chartColors.dark : chartColors.light

  // Process data for Chart.js format
  const labels = data.map((item) => item[index])

  const datasets = categories.map((category, i) => ({
    label: category,
    data: data.map((item) => item[category]),
    borderColor: colorScheme.borderColor[i % colorScheme.borderColor.length],
    backgroundColor: colorScheme.backgroundColor[i % colorScheme.backgroundColor.length],
    tension: 0.3,
    fill: false,
  }))

  const chartData = {
    labels,
    datasets,
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: showAnimation
      ? {
          duration: 1000,
          easing: "easeOutQuart",
        }
      : false,
    plugins: {
      legend: {
        display: showLegend,
        position: "top",
        labels: {
          color: isDarkMode ? "#e5e7eb" : "#374151",
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || ""
            if (label) {
              label += ": "
            }
            if (context.parsed.y !== null) {
              label += valueFormatter ? valueFormatter(context.parsed.y) : context.parsed.y
            }
            return label
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: isDarkMode ? "#e5e7eb" : "#374151",
        },
        grid: {
          display: false,
        },
      },
      y: {
        ticks: {
          color: isDarkMode ? "#e5e7eb" : "#374151",
        },
        grid: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
      },
    },
  }

  return (
    <div className={className}>
      <Line data={chartData} options={options} />
    </div>
  )
}

export const PieChart = ({ data, index, valueFormatter, className }) => {
  // Determine if we're in dark mode
  const isDarkMode =
    typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches

  // Get the appropriate color scheme
  const colorScheme = isDarkMode ? chartColors.dark : chartColors.light

  // Process data for Chart.js format
  const chartData = {
    labels: data.map((item) => item[index]),
    datasets: [
      {
        data: data.map((item) => item.value),
        backgroundColor: colorScheme.backgroundColor.slice(0, data.length),
        borderColor: colorScheme.borderColor.slice(0, data.length),
        borderWidth: colorScheme.borderWidth,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: isDarkMode ? "#e5e7eb" : "#374151",
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || ""
            const value = context.raw || 0
            const formattedValue = valueFormatter ? valueFormatter(value) : value
            return `${label}: ${formattedValue}`
          },
        },
      },
    },
    cutout: "50%",
    animation: {
      animateScale: true,
      animateRotate: true,
    },
  }

  return (
    <div className={className}>
      <Doughnut data={chartData} options={options} />
    </div>
  )
}

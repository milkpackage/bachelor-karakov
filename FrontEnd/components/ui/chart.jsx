"use client"
import { BarChart as TremorBarChart } from "@tremor/react"
import { LineChart as TremorLineChart } from "@tremor/react"
import { DonutChart } from "@tremor/react"

export const BarChart = ({ data, index, categories, colors, valueFormatter, className }) => {
  return (
    <TremorBarChart
      data={data}
      index={index}
      categories={categories}
      colors={colors}
      valueFormatter={valueFormatter}
      className={className}
    />
  )
}

export const LineChart = ({
  data,
  index,
  categories,
  colors,
  valueFormatter,
  className,
  showLegend,
  yAxisWidth,
  showAnimation,
}) => {
  return (
    <TremorLineChart
      data={data}
      index={index}
      categories={categories}
      colors={colors}
      valueFormatter={valueFormatter}
      className={`${className} text-white`}
      showLegend={showLegend}
      yAxisWidth={yAxisWidth}
      showAnimation={showAnimation}
      showYAxis={false}
      showGridLines={false}
    />
  )
}

export const PieChart = ({ data, index, valueFormatter, className }) => {
  return <DonutChart data={data} category="value" index={index} valueFormatter={valueFormatter} className={className} />
}

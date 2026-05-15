import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

interface SalesChartProps {
  data: Array<{ date: string; total: number }>;
}

export default function SalesChart({ data }: SalesChartProps) {
  return (
    <LineChart width={500} height={300} data={data}>
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="total" />
    </LineChart>
  );
}
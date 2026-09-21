import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#0E86D4', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#6366F1'];

export const StudentsByClassChart = ({ data = [] }) => {
    if (!data.length) return null;

    return (
        <div className="bg-white dark:bg-[#1A1D2B] rounded-2xl border border-gray-100 dark:border-[#2D3348] p-5">
            <h3 className="text-sm font-bold text-ink mb-4">Students by Class</h3>
            <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }}
                        formatter={(value) => [value, 'Students']}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {data.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export const GenderPieChart = ({ male = 0, female = 0 }) => {
    const data = [
        { name: 'Male', value: male },
        { name: 'Female', value: female },
    ].filter(d => d.value > 0);

    if (!data.length) return null;

    return (
        <div className="bg-white dark:bg-[#1A1D2B] rounded-2xl border border-gray-100 dark:border-[#2D3348] p-5">
            <h3 className="text-sm font-bold text-ink mb-4">Gender Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        <Cell fill="#0E86D4" />
                        <Cell fill="#8B5CF6" />
                    </Pie>
                    <Tooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

const Charts = { StudentsByClassChart, GenderPieChart };
export default Charts;

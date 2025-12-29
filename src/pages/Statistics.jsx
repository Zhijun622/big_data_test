import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { dataManager } from '../utils/dataManager'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function Statistics() {
  const [stats, setStats] = useState({
    totalQuestions: 0,
    practicedCount: 0,
    totalAccuracy: 0,
    records: [],
    unitStats: [],
    accuracyTrend: []
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const [questions, records, wrongList] = await Promise.all([
      dataManager.loadQuestions(),
      dataManager.loadRecords(),
      dataManager.loadWrongQuestions()
    ])

    // 计算总体统计
    const practicedQuestionIds = new Set()
    records.forEach(r => {
      r.details.forEach(d => practicedQuestionIds.add(d.questionId))
    })

    const totalAccuracy = records.length > 0
      ? records.reduce((sum, r) => sum + r.accuracy, 0) / records.length
      : 0

    // 按单元统计
    const unitMap = new Map()
    questions.forEach(q => {
      if (!unitMap.has(q.unit)) {
        unitMap.set(q.unit, {
          unit: q.unit,
          total: 0,
          correct: 0,
          wrong: 0
        })
      }
      const unitStat = unitMap.get(q.unit)
      unitStat.total++

      // 统计该单元的正确率
      records.forEach(r => {
        r.details.forEach(d => {
          if (d.questionId === q.id) {
            if (d.isCorrect) {
              unitStat.correct++
            } else {
              unitStat.wrong++
            }
          }
        })
      })
    })

    const unitStats = Array.from(unitMap.values()).map(u => ({
      ...u,
      accuracy: u.total > 0 ? (u.correct / (u.correct + u.wrong)) * 100 : 0
    }))

    // 正确率趋势（最近10次）
    const recentRecords = records.slice(-10).map((r, idx) => ({
      name: `第${idx + 1}次`,
      accuracy: Math.round(r.accuracy * 100)
    }))

    setStats({
      totalQuestions: questions.length,
      practicedCount: practicedQuestionIds.size,
      totalAccuracy: Math.round(totalAccuracy * 100),
      records,
      unitStats,
      accuracyTrend: recentRecords
    })
  }

  const wrongCount = stats.records.reduce((sum, r) => {
    return sum + r.details.filter(d => !d.isCorrect).length
  }, 0)

  const pieData = [
    { name: '已练习', value: stats.practicedCount },
    { name: '未练习', value: stats.totalQuestions - stats.practicedCount }
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">学习统计</h1>

      {/* 总体数据卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">总题数</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalQuestions}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">已练习题数</p>
          <p className="text-3xl font-bold text-blue-600">{stats.practicedCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">总正确率</p>
          <p className="text-3xl font-bold text-green-600">{stats.totalAccuracy}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">错题总数</p>
          <p className="text-3xl font-bold text-red-600">{wrongCount}</p>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 练习进度饼图 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">练习进度</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 正确率趋势 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">正确率趋势（最近10次）</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.accuracyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#3b82f6"
                strokeWidth={2}
                name="正确率(%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 单元掌握情况 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">各单元掌握情况</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={stats.unitStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="unit"
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="accuracy" fill="#3b82f6" name="正确率(%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 历史记录 */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h3 className="text-lg font-bold mb-4">历史测验记录</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  模式
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  题数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  正确数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  正确率
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.records.slice().reverse().map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.timestamp).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {record.mode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {record.totalQuestions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {record.correctCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`font-medium ${
                        record.accuracy >= 0.8
                          ? 'text-green-600'
                          : record.accuracy >= 0.6
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {Math.round(record.accuracy * 100)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stats.records.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              暂无测验记录
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



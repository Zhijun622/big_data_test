import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Database, ClipboardList, AlertCircle, BarChart3, Plus } from 'lucide-react'
import { dataManager } from '../utils/dataManager'

export default function Home() {
  const [stats, setStats] = useState({
    totalQuestions: 0,
    wrongCount: 0,
    totalAccuracy: 0
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const questions = await dataManager.loadQuestions()
    const wrongList = await dataManager.loadWrongQuestions()
    const records = await dataManager.loadRecords()
    
    const activeWrong = wrongList.filter(w => !w.mastered).length
    const totalAccuracy = records.length > 0
      ? records.reduce((sum, r) => sum + r.accuracy, 0) / records.length
      : 0

    setStats({
      totalQuestions: questions.length,
      wrongCount: activeWrong,
      totalAccuracy: Math.round(totalAccuracy * 100)
    })
  }

  const cards = [
    {
      title: '题库管理',
      description: `共 ${stats.totalQuestions} 道题目`,
      icon: Database,
      link: '/bank',
      color: 'blue',
      action: '管理题目'
    },
    {
      title: '开始测验',
      description: '多种测验模式',
      icon: ClipboardList,
      link: '/quiz-mode',
      color: 'green',
      action: '开始测验'
    },
    {
      title: '错题本',
      description: `${stats.wrongCount} 道错题待复习`,
      icon: AlertCircle,
      link: '/wrong',
      color: 'red',
      action: '查看错题'
    },
    {
      title: '学习统计',
      description: `总体正确率 ${stats.totalAccuracy}%`,
      icon: BarChart3,
      link: '/stats',
      color: 'purple',
      action: '查看统计'
    }
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">欢迎使用大数据导论练习系统</h1>
        <p className="text-gray-600">通过练习提升对大数据导论知识的掌握程度</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon
          const colorClasses = {
            blue: 'bg-blue-50 border-blue-200 text-blue-700',
            green: 'bg-green-50 border-green-200 text-green-700',
            red: 'bg-red-50 border-red-200 text-red-700',
            purple: 'bg-purple-50 border-purple-200 text-purple-700'
          }

          return (
            <Link
              key={card.title}
              to={card.link}
              className={`block p-6 rounded-lg border-2 transition-all hover:shadow-lg ${colorClasses[card.color]}`}
            >
              <div className="flex items-center justify-between mb-4">
                <Icon className="h-8 w-8" />
                <span className="text-sm font-medium">{card.action}</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{card.title}</h3>
              <p className="text-sm opacity-80">{card.description}</p>
            </Link>
          )
        })}
      </div>

      {stats.totalQuestions === 0 && (
        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <Plus className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <h3 className="font-semibold text-yellow-900">题库为空</h3>
              <p className="text-sm text-yellow-700 mt-1">
                请先导入题目或添加题目到题库中
              </p>
            </div>
            <Link
              to="/bank"
              className="ml-auto px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium"
            >
              去导入题目
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}


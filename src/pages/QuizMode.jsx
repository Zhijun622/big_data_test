import { useNavigate } from 'react-router-dom'
import { Database, Shuffle, BookOpen, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { dataManager } from '../utils/dataManager'

export default function QuizMode() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [units, setUnits] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')
  const [randomCount, setRandomCount] = useState(20)
  const [allQuestions, setAllQuestions] = useState([])

  useEffect(() => {
    loadUnits()
  }, [])

  useEffect(() => {
    if (allQuestions.length === 0) return
    const filteredUnits = allQuestions
      .filter(q => !selectedCourse || (q.course || '大数据导论') === selectedCourse)
      .map(q => q.unit)
    const uniqueUnits = [...new Set(filteredUnits)]
    setUnits(uniqueUnits)
    setSelectedUnit('')
  }, [selectedCourse, allQuestions])

  const loadUnits = async () => {
    const questions = await dataManager.loadQuestions()
    setAllQuestions(questions)
    const uniqueCourses = [...new Set(questions.map(q => q.course || '大数据导论'))]
    setCourses(uniqueCourses)
    if (!selectedCourse && uniqueCourses.length > 0) {
      setSelectedCourse(uniqueCourses[0])
    }
  }

  const handleStartQuiz = (mode) => {
    let url = `/quiz?mode=${mode}`
    if (selectedCourse) {
      url += `&course=${encodeURIComponent(selectedCourse)}`
    }
    if (mode === 'unit' && selectedUnit) {
      url += `&unit=${encodeURIComponent(selectedUnit)}`
    } else if (mode === 'random') {
      url += `&count=${randomCount}`
    }
    navigate(url)
  }

  const modes = [
    {
      id: 'all',
      title: '全部题目测验',
      description: '测验题库中的所有题目',
      icon: Database,
      color: 'blue'
    },
    {
      id: 'unit',
      title: '按单元测验',
      description: '选择特定章节进行测验',
      icon: BookOpen,
      color: 'green'
    },
    {
      id: 'random',
      title: '随机抽取测验',
      description: '随机抽取指定数量的题目',
      icon: Shuffle,
      color: 'purple'
    },
    {
      id: 'wrong',
      title: '错题专项测验',
      description: '只测验错题本中的题目',
      icon: AlertCircle,
      color: 'red'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">选择测验模式</h1>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <label className="text-sm font-medium text-gray-700 mr-3">选择通道：</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          {courses.map(course => (
            <option key={course} value={course}>{course}</option>
          ))}
        </select>
        <span className="ml-3 text-gray-500 text-sm">先选择「大数据导论」或「计算机网络」，再选择测验模式</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {modes.map((mode) => {
          const Icon = mode.icon
          const colorClasses = {
            blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
            green: 'bg-green-50 border-green-200 hover:bg-green-100',
            purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
            red: 'bg-red-50 border-red-200 hover:bg-red-100'
          }

          return (
            <div
              key={mode.id}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${colorClasses[mode.color]}`}
              onClick={() => {
                if (mode.id === 'unit') return
                handleStartQuiz(mode.id)
              }}
            >
              <div className="flex items-center mb-4">
                <Icon className="h-8 w-8 mr-3" />
                <h3 className="text-xl font-bold">{mode.title}</h3>
              </div>
              <p className="text-gray-600 mb-4">{mode.description}</p>
              {mode.id === 'unit' && units.length > 0 && (
                <div className="mb-4">
                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择章节</option>
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                  {selectedUnit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartQuiz('unit')
                      }}
                      className="mt-2 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      开始测验
                    </button>
                  )}
                </div>
              )}
              {mode.id === 'random' && (
                <div className="mb-4">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={randomCount}
                    onChange={(e) => setRandomCount(parseInt(e.target.value) || 20)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStartQuiz('random')
                    }}
                    className="mt-2 w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    开始测验
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


import { useEffect, useState } from 'react'
import { Plus, Upload, Search, Filter, Edit2, Trash2, RefreshCw } from 'lucide-react'
import { dataManager } from '../utils/dataManager'

export default function QuestionBank() {
  const [questions, setQuestions] = useState([])
  const [filteredQuestions, setFilteredQuestions] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [selectedUnit, setSelectedUnit] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    loadQuestions()
  }, [])

  useEffect(() => {
    filterQuestions()
  }, [questions, selectedCourse, selectedUnit, searchText])

  const loadQuestions = async () => {
    const loaded = await dataManager.loadQuestions()
    
    // 检查已加载的题目中是否包含所有课程
    const loadedCourses = new Set(loaded.map(q => q.course || '大数据导论'))
    const hasNetworkCourse = loadedCourses.has('计算机网络')
    
    // 如果题目为空，或者缺少计算机网络课程，尝试从questions.json导入/更新
    if (loaded.length === 0 || !hasNetworkCourse) {
      try {
        // 使用相对路径，兼容GitHub Pages
        const baseUrl = import.meta.env.BASE_URL || '/'
        const response = await fetch(`${baseUrl}questions.json`)
        if (response.ok) {
          const data = await response.json()
          const defaultQuestions = data.questions || []
          if (defaultQuestions.length > 0) {
            if (loaded.length === 0) {
              // 首次导入
              await dataManager.saveQuestions(defaultQuestions)
              setQuestions(defaultQuestions)
              alert(`成功导入 ${defaultQuestions.length} 道默认题目`)
            } else {
              // 合并更新：保留现有题目，添加新的计算机网络题目
              const existingIds = new Set(loaded.map(q => q.id))
              const newQuestions = defaultQuestions.filter(q => !existingIds.has(q.id))
              const updated = [...loaded, ...newQuestions]
              await dataManager.saveQuestions(updated)
              setQuestions(updated)
              if (newQuestions.length > 0) {
                alert(`已更新题库，新增 ${newQuestions.length} 道题目（包含计算机网络）`)
              }
            }
            return
          }
        }
      } catch (error) {
        console.log('无法加载默认题目，请手动导入', error)
      }
    }
    setQuestions(loaded)
  }

  const filterQuestions = () => {
    let filtered = questions

    if (selectedCourse !== 'all') {
      filtered = filtered.filter(q => (q.course || '大数据导论') === selectedCourse)
    }

    if (selectedUnit !== 'all') {
      filtered = filtered.filter(q => q.unit === selectedUnit)
    }

    if (searchText) {
      filtered = filtered.filter(q =>
        q.question.toLowerCase().includes(searchText.toLowerCase())
      )
    }

    setFilteredQuestions(filtered)
  }

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (file) {
        const text = await file.text()
        try {
          const data = JSON.parse(text)
          const importedQuestions = data.questions || []
          const updated = [...questions, ...importedQuestions]
          await dataManager.saveQuestions(updated)
          setQuestions(updated)
          alert(`成功导入 ${importedQuestions.length} 道题目`)
        } catch (error) {
          alert('导入失败：文件格式错误')
        }
      }
    }
    input.click()
  }

  const handleDelete = async (id) => {
    if (confirm('确定要删除这道题目吗？')) {
      const updated = questions.filter(q => q.id !== id)
      await dataManager.saveQuestions(updated)
      setQuestions(updated)
    }
  }

  const handleReload = async () => {
    try {
      const baseUrl = import.meta.env.BASE_URL || '/'
      const response = await fetch(`${baseUrl}questions.json`)
      if (response.ok) {
        const data = await response.json()
        const defaultQuestions = data.questions || []
        if (defaultQuestions.length > 0) {
          await dataManager.saveQuestions(defaultQuestions)
          setQuestions(defaultQuestions)
          alert(`已重新加载题库，共 ${defaultQuestions.length} 道题目`)
        }
      }
    } catch (error) {
      alert('重新加载失败：' + error.message)
    }
  }

  const courses = ['all', ...new Set(questions.map(q => q.course || '大数据导论'))]
  const units = ['all', ...new Set(questions.filter(q => selectedCourse === 'all' ? true : (q.course || '大数据导论') === selectedCourse).map(q => q.unit))]

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">题库管理</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleReload}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            title="从 questions.json 重新加载题库"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            重新加载题库
          </button>
          <button
            onClick={handleImport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            导入JSON
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            添加题目
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索题目..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center">
            <Filter className="h-4 w-4 text-gray-400 mr-2" />
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value)
                setSelectedUnit('all')
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 mr-3"
            >
              {courses.map(course => (
                <option key={course} value={course}>
                  {course === 'all' ? '全部通道' : course}
                </option>
              ))}
            </select>
            <Filter className="h-4 w-4 text-gray-400 mr-2" />
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              {units.map(unit => (
                <option key={unit} value={unit}>
                  {unit === 'all' ? '全部章节' : unit}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            共 {filteredQuestions.length} 道题目
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredQuestions.map((q) => (
            <div key={q.id} className="p-6 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      q.type === 'single' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {q.type === 'single' ? '单选' : '多选'}
                    </span>
                  <span className="ml-2 text-sm text-gray-500">{q.course || '大数据导论'} / {q.unit}</span>
                  </div>
                  <p className="text-gray-900 font-medium mb-2">{q.question}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    {q.options.map(opt => (
                      <div key={opt.key}>
                        <span className="font-medium">{opt.key}.</span> {opt.text}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="ml-4 flex space-x-2">
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredQuestions.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <p>暂无题目</p>
          </div>
        )}
      </div>
    </div>
  )
}


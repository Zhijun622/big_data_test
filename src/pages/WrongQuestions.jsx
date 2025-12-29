import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, CheckCircle2, X } from 'lucide-react'
import { dataManager } from '../utils/dataManager'

export default function WrongQuestions() {
  const navigate = useNavigate()
  const [wrongList, setWrongList] = useState([])
  const [questions, setQuestions] = useState([])
  const [wrongQuestions, setWrongQuestions] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [selectedUnit, setSelectedUnit] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterWrongQuestions()
  }, [wrongList, questions, selectedCourse, selectedUnit])

  const loadData = async () => {
    const [loadedWrong, loadedQuestions] = await Promise.all([
      dataManager.loadWrongQuestions(),
      dataManager.loadQuestions()
    ])

    setWrongList(loadedWrong)
    setQuestions(loadedQuestions)
  }

  const filterWrongQuestions = () => {
    // 合并错题信息和题目内容
    const activeWrong = wrongList.filter(w => !w.mastered)
    let wrongWithDetails = activeWrong
      .map(w => {
        // 确保questionId是字符串类型进行匹配
        const question = questions.find(q => String(q.id) === String(w.questionId))
        if (!question) {
          // 如果找不到题目，可能是题目ID不匹配，记录到控制台
          console.warn('找不到错题对应的题目:', {
            wrongQuestionId: w.questionId,
            wrongQuestionIdType: typeof w.questionId,
            availableQuestionIds: questions.slice(0, 5).map(q => ({ id: q.id, type: typeof q.id }))
          })
          return null
        }
        return { ...w, question }
      })
      .filter(Boolean)

    // 按通道筛选
    if (selectedCourse !== 'all') {
      wrongWithDetails = wrongWithDetails.filter(item => (item.question.course || '大数据导论') === selectedCourse)
    }
    // 按章节筛选
    if (selectedUnit !== 'all') {
      wrongWithDetails = wrongWithDetails.filter(item => item.question.unit === selectedUnit)
    }

    // 按错误次数排序
    wrongWithDetails.sort((a, b) => b.wrongCount - a.wrongCount)

    setWrongQuestions(wrongWithDetails)
  }

  const handleStartQuiz = () => {
    navigate('/quiz?mode=wrong')
  }

  const handleMarkMastered = async (questionId) => {
    await dataManager.markMastered(questionId)
    loadData()
  }

  const handleClearMastered = async () => {
    if (confirm('确定要清空已掌握的错题吗？')) {
      const activeWrong = wrongList.filter(w => !w.mastered)
      await dataManager.saveWrongQuestions(activeWrong)
      loadData()
    }
  }

  const handleClearAll = async () => {
    if (confirm('确定要清空所有错题吗？此操作不可恢复！')) {
      await dataManager.saveWrongQuestions([])
      loadData()
    }
  }

  const handleRestoreFromRecords = async () => {
    if (confirm('从历史测验记录中恢复错题？这将根据所有历史记录重新生成错题本。')) {
      const records = await dataManager.loadRecords()
      const wrongQuestionMap = new Map() // 使用Map来统计错误次数
      
      // 从所有历史记录中提取错题
      records.forEach(record => {
        record.details.forEach(detail => {
          // 重要：只有 isCorrect 为 false 的才是错题
          if (detail.isCorrect === false) {
            const questionId = detail.questionId
            if (!wrongQuestionMap.has(questionId)) {
              wrongQuestionMap.set(questionId, {
                questionId,
                wrongCount: 0,
                lastWrongTime: 0,
                mastered: false
              })
            }
            const wrongItem = wrongQuestionMap.get(questionId)
            wrongItem.wrongCount++
            // 更新最后错误时间（使用记录的时间戳）
            if (record.timestamp > wrongItem.lastWrongTime) {
              wrongItem.lastWrongTime = record.timestamp
            }
          }
        })
      })
      
      // 转换为数组
      const newWrongList = Array.from(wrongQuestionMap.values())
      
      console.log('从历史记录恢复错题:', {
        总记录数: records.length,
        错题数: newWrongList.length,
        错题详情: newWrongList
      })
      
      await dataManager.saveWrongQuestions(newWrongList)
      loadData()
      alert(`已从历史记录中恢复 ${newWrongList.length} 道错题`)
    }
  }

  const masteredCount = wrongList.filter(w => w.mastered).length

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">错题本</h1>
            <p className="text-gray-600 mt-1">
              共 {wrongQuestions.length} 道错题待复习
              {masteredCount > 0 && `，${masteredCount} 道已掌握`}
            </p>
          </div>
          <div className="flex space-x-2">
            {masteredCount > 0 && (
              <button
                onClick={handleClearMastered}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                清空已掌握
              </button>
            )}
            {wrongList.filter(w => !w.mastered).length > 0 && (
              <>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  清空所有错题
                </button>
                <button
                  onClick={handleRestoreFromRecords}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  从历史记录恢复错题
                </button>
              </>
            )}
            {wrongQuestions.length > 0 && (
              <button
                onClick={handleStartQuiz}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Play className="h-4 w-4 mr-2" />
                开始练习
              </button>
            )}
          </div>
        </div>
        {/* 章节筛选 */}
        {wrongList.filter(w => !w.mastered).length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">筛选通道：</label>
              <select
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value)
                  setSelectedUnit('all')
                }}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部通道</option>
                {Array.from(new Set(questions.map(q => q.course || '大数据导论'))).map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">筛选章节：</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部章节</option>
              {Array.from(new Set(
                questions
                  .filter(q => selectedCourse === 'all' ? true : (q.course || '大数据导论') === selectedCourse)
                  .map(q => q.unit)
              )).sort().map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
            </div>
          </div>
        )}
      </div>

      {wrongQuestions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">暂无错题</h3>
          <p className="text-gray-600">继续努力，保持全对！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {wrongQuestions.map((item) => (
            <div
              key={item.questionId}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                    错误 {item.wrongCount} 次
                  </span>
                  <span className="text-sm text-gray-500">{item.question.course || '大数据导论'}</span>
                  <span className="text-sm text-gray-500">{item.question.unit}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    item.question.type === 'single'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {item.question.type === 'single' ? '单选' : '多选'}
                  </span>
                </div>
                <button
                  onClick={() => handleMarkMastered(item.questionId)}
                  className="flex items-center px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  标记已掌握
                </button>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-3">
                {item.question.question}
              </h3>

              <div className="grid grid-cols-2 gap-2 mb-3">
                {item.question.options.map(opt => (
                  <div key={opt.key} className="text-sm text-gray-600">
                    <span className="font-medium">{opt.key}.</span> {opt.text}
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded">
                <p className="text-sm text-gray-700">
                  <strong>正确答案：</strong>
                  <span className="text-green-700 font-medium ml-2">
                    {item.question.correctAnswer.join(', ')}
                  </span>
                </p>
                {item.question.explanation && (
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>解析：</strong> {item.question.explanation}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, CheckCircle2, X } from 'lucide-react'
import { dataManager } from '../utils/dataManager'

export default function WrongQuestions() {
  const navigate = useNavigate()
  const [wrongList, setWrongList] = useState([])
  const [questions, setQuestions] = useState([])
  const [wrongQuestions, setWrongQuestions] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [loadedWrong, loadedQuestions] = await Promise.all([
      dataManager.loadWrongQuestions(),
      dataManager.loadQuestions()
    ])

    setWrongList(loadedWrong)
    setQuestions(loadedQuestions)

    // 合并错题信息和题目内容
    const activeWrong = loadedWrong.filter(w => !w.mastered)
    const wrongWithDetails = activeWrong
      .map(w => {
        const question = loadedQuestions.find(q => q.id === w.questionId)
        return question ? { ...w, question } : null
      })
      .filter(Boolean)
      .sort((a, b) => b.wrongCount - a.wrongCount)

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

  const masteredCount = wrongList.filter(w => w.mastered).length

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
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


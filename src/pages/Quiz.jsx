import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Check } from 'lucide-react'
import { dataManager } from '../utils/dataManager'

export default function Quiz() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState(null)
  const [mode, setMode] = useState(null)

  useEffect(() => {
    // 从URL参数获取模式
    const params = new URLSearchParams(window.location.search)
    const quizMode = params.get('mode') || 'all'
    const unit = params.get('unit')
    const count = params.get('count')

    loadQuestions(quizMode, unit, count)
  }, [])

  const loadQuestions = async (quizMode, unit, count) => {
    const allQuestions = await dataManager.loadQuestions()
    let selectedQuestions = []

    switch (quizMode) {
      case 'all':
        selectedQuestions = allQuestions
        break
      case 'unit':
        selectedQuestions = allQuestions.filter(q => q.unit === unit)
        break
      case 'random':
        const randomCount = parseInt(count) || 20
        const shuffled = [...allQuestions].sort(() => Math.random() - 0.5)
        selectedQuestions = shuffled.slice(0, randomCount)
        break
      case 'wrong':
        const wrongList = await dataManager.loadWrongQuestions()
        const wrongIds = wrongList.filter(w => !w.mastered).map(w => w.questionId)
        selectedQuestions = allQuestions.filter(q => wrongIds.includes(q.id))
        break
      default:
        selectedQuestions = allQuestions
    }

    setQuestions(selectedQuestions)
    setMode(quizMode)
    setAnswers({})
  }

  const handleAnswerChange = (questionId, optionKey) => {
    const question = questions.find(q => q.id === questionId)
    if (!question) return

    if (question.type === 'single') {
      setAnswers({ ...answers, [questionId]: [optionKey] })
    } else {
      const current = answers[questionId] || []
      if (current.includes(optionKey)) {
        setAnswers({ ...answers, [questionId]: current.filter(k => k !== optionKey) })
      } else {
        setAnswers({ ...answers, [questionId]: [...current, optionKey] })
      }
    }
  }

  const handleSubmit = async () => {
    if (!confirm('确定要提交测验吗？提交后将显示结果。')) {
      return
    }

    const details = []
    let correctCount = 0

    for (const question of questions) {
      const userAnswer = (answers[question.id] || []).sort()
      const correctAnswer = [...question.correctAnswer].sort()
      const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctAnswer)

      if (isCorrect) {
        correctCount++
      } else {
        // 添加到错题本
        await dataManager.addWrongQuestion(question.id)
      }

      details.push({
        questionId: question.id,
        userAnswer,
        isCorrect
      })
    }

    const accuracy = questions.length > 0 ? correctCount / questions.length : 0

    const record = {
      id: `record_${Date.now()}`,
      timestamp: Date.now(),
      mode: mode === 'all' ? '全部题目' : mode === 'unit' ? '按单元' : mode === 'random' ? '随机抽取' : '错题专项',
      totalQuestions: questions.length,
      correctCount,
      accuracy,
      details
    }

    const records = await dataManager.loadRecords()
    records.push(record)
    await dataManager.saveRecords(records)

    setResult(record)
    setShowResult(true)
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">暂无题目，请先导入题目</p>
        <button
          onClick={() => navigate('/bank')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          去导入题目
        </button>
      </div>
    )
  }

  if (showResult && result) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8 text-center mb-6">
          <h2 className="text-3xl font-bold mb-4">测验完成！</h2>
          <div className="text-6xl font-bold text-blue-600 mb-2">
            {Math.round(result.accuracy * 100)}%
          </div>
          <p className="text-gray-600 mb-6">
            正确 {result.correctCount} / 总共 {result.totalQuestions} 道
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/wrong')}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              查看错题
            </button>
            <button
              onClick={() => {
                setShowResult(false)
                setCurrentIndex(0)
                setAnswers({})
                setResult(null)
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              重新测验
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              返回主页
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">答题详情</h3>
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const detail = result.details.find(d => d.questionId === q.id)
              const isCorrect = detail?.isCorrect
              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-lg border-2 ${
                    isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start mb-2">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">
                        {idx + 1}. {q.question}
                      </p>
                      <div className="mt-2 text-sm">
                        <p className="text-gray-600">
                          你的答案: {detail?.userAnswer.join(', ') || '未答'}
                        </p>
                        <p className="text-gray-600">
                          正确答案: {q.correctAnswer.join(', ')}
                        </p>
                        {q.explanation && (
                          <p className="mt-2 text-gray-700 bg-white p-2 rounded">
                            <strong>解析：</strong> {q.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100
  const userAnswer = answers[currentQuestion?.id] || []

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">测验进行中</h2>
          <span className="text-gray-600">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {currentQuestion && (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-6">
            <span className={`px-3 py-1 text-sm font-medium rounded ${
              currentQuestion.type === 'single'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-purple-100 text-purple-700'
            }`}>
              {currentQuestion.type === 'single' ? '单选题' : '多选题'}
            </span>
            <span className="ml-3 text-sm text-gray-500">{currentQuestion.unit}</span>
          </div>

          <h3 className="text-xl font-bold mb-6">{currentQuestion.question}</h3>

          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((opt) => {
              const isSelected = userAnswer.includes(opt.key)
              return (
                <button
                  key={opt.key}
                  onClick={() => handleAnswerChange(currentQuestion.id, opt.key)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    {currentQuestion.type === 'single' ? (
                      <div
                        className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    ) : (
                      <div
                        className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                    )}
                    <span className="font-medium mr-2">{opt.key}.</span>
                    <span>{opt.text}</span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              上一题
            </button>
            {currentIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                提交测验
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                下一题
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


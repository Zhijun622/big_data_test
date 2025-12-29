import { storage } from './storage'

// 数据管理工具
export const dataManager = {
  // 加载题库
  async loadQuestions() {
    try {
      const result = await storage.get('quiz-bank', false)
      if (result && result.value) {
        const parsed = JSON.parse(result.value)
        // 兼容旧数据：补充 course 字段
        return parsed.map(q => ({
          course: q.course || '大数据导论',
          ...q
        }))
      }
      return []
    } catch (error) {
      console.error('Load questions error:', error)
      return []
    }
  },

  // 保存题库
  async saveQuestions(questions) {
    try {
      await storage.set('quiz-bank', JSON.stringify(questions), false)
    } catch (error) {
      console.error('Save questions error:', error)
    }
  },

  // 加载测验记录
  async loadRecords() {
    try {
      const result = await storage.get('quiz-records', false)
      if (result && result.value) {
        return JSON.parse(result.value)
      }
      return []
    } catch (error) {
      console.error('Load records error:', error)
      return []
    }
  },

  // 保存测验记录
  async saveRecords(records) {
    try {
      await storage.set('quiz-records', JSON.stringify(records), false)
    } catch (error) {
      console.error('Save records error:', error)
    }
  },

  // 加载错题本
  async loadWrongQuestions() {
    try {
      const result = await storage.get('wrong-questions', false)
      if (result && result.value) {
        return JSON.parse(result.value)
      }
      return []
    } catch (error) {
      console.error('Load wrong questions error:', error)
      return []
    }
  },

  // 保存错题本
  async saveWrongQuestions(wrongList) {
    try {
      await storage.set('wrong-questions', JSON.stringify(wrongList), false)
    } catch (error) {
      console.error('Save wrong questions error:', error)
    }
  },

  // 添加错题
  async addWrongQuestion(questionId) {
    if (!questionId) {
      console.error('addWrongQuestion: questionId 为空')
      return
    }
    
    const wrongList = await this.loadWrongQuestions()
    // 确保questionId是字符串类型进行匹配
    const existing = wrongList.find(w => String(w.questionId) === String(questionId))
    
    if (existing) {
      // 如果已存在，增加错误次数
      existing.wrongCount += 1
      existing.lastWrongTime = Date.now()
      existing.mastered = false // 确保未掌握状态
    } else {
      // 如果不存在，添加新记录
      wrongList.push({
        questionId: String(questionId), // 确保是字符串
        wrongCount: 1,
        lastWrongTime: Date.now(),
        mastered: false
      })
    }
    
    await this.saveWrongQuestions(wrongList)
    return wrongList
  },

  // 标记错题为已掌握
  async markMastered(questionId) {
    const wrongList = await this.loadWrongQuestions()
    const item = wrongList.find(w => w.questionId === questionId)
    if (item) {
      item.mastered = true
      await this.saveWrongQuestions(wrongList)
    }
    return wrongList
  }
}


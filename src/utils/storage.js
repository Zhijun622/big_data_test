// Storage API封装
export const storage = {
  async get(key, isSession = false) {
    try {
      if (window.storage && window.storage.get) {
        return await window.storage.get(key, isSession)
      } else {
        // 降级到localStorage
        const value = localStorage.getItem(key)
        return value ? { value } : null
      }
    } catch (error) {
      console.error('Storage get error:', error)
      return null
    }
  },

  async set(key, value, isSession = false) {
    try {
      if (window.storage && window.storage.set) {
        await window.storage.set(key, value, isSession)
      } else {
        // 降级到localStorage
        localStorage.setItem(key, value)
      }
    } catch (error) {
      console.error('Storage set error:', error)
    }
  },

  async remove(key, isSession = false) {
    try {
      if (window.storage && window.storage.remove) {
        await window.storage.remove(key, isSession)
      } else {
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.error('Storage remove error:', error)
    }
  },

  async clear(isSession = false) {
    try {
      if (window.storage && window.storage.clear) {
        await window.storage.clear(isSession)
      } else {
        localStorage.clear()
      }
    } catch (error) {
      console.error('Storage clear error:', error)
    }
  }
}


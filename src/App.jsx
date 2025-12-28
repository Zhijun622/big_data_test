import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import QuestionBank from './pages/QuestionBank'
import QuizMode from './pages/QuizMode'
import Quiz from './pages/Quiz'
import WrongQuestions from './pages/WrongQuestions'
import Statistics from './pages/Statistics'
import Layout from './components/Layout'

function App() {
  return (
    <BrowserRouter basename="/big_data_test">
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/bank" element={<QuestionBank />} />
          <Route path="/quiz-mode" element={<QuizMode />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/wrong" element={<WrongQuestions />} />
          <Route path="/stats" element={<Statistics />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App


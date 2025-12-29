/**
 * 数据提取脚本
 * 在浏览器控制台运行此脚本，提取测验记录和错题数据
 */

// 获取localStorage中的数据
function extractQuizData() {
  const data = {
    questions: [],
    records: [],
    wrongQuestions: []
  };

  // 提取题库数据
  const questionsData = localStorage.getItem('quiz-bank');
  if (questionsData) {
    data.questions = JSON.parse(questionsData);
  }

  // 提取测验记录
  const recordsData = localStorage.getItem('quiz-records');
  if (recordsData) {
    data.records = JSON.parse(recordsData);
  }

  // 提取错题本
  const wrongData = localStorage.getItem('wrong-questions');
  if (wrongData) {
    data.wrongQuestions = JSON.parse(wrongData);
  }

  return data;
}

// 分析错题
function analyzeWrongQuestions(data) {
  const analysis = {
    totalWrong: 0,
    wrongByUnit: {},
    wrongByType: { single: 0, multiple: 0 },
    wrongQuestions: []
  };

  // 从测验记录中统计错题
  const wrongQuestionMap = new Map();

  data.records.forEach(record => {
    record.details.forEach(detail => {
      if (detail.isCorrect === false) {
        const questionId = detail.questionId;
        if (!wrongQuestionMap.has(questionId)) {
          wrongQuestionMap.set(questionId, {
            questionId,
            wrongCount: 0,
            timestamps: []
          });
        }
        const wrongItem = wrongQuestionMap.get(questionId);
        wrongItem.wrongCount++;
        wrongItem.timestamps.push(record.timestamp);
      }
    });
  });

  // 合并题目详情
  wrongQuestionMap.forEach((wrongItem, questionId) => {
    const question = data.questions.find(q => q.id === questionId);
    if (question) {
      analysis.wrongQuestions.push({
        ...wrongItem,
        question: question
      });

      // 按单元统计
      if (!analysis.wrongByUnit[question.unit]) {
        analysis.wrongByUnit[question.unit] = 0;
      }
      analysis.wrongByUnit[question.unit]++;

      // 按类型统计
      if (question.type === 'single') {
        analysis.wrongByType.single++;
      } else {
        analysis.wrongByType.multiple++;
      }
    }
  });

  analysis.totalWrong = analysis.wrongQuestions.length;

  // 按错误次数排序
  analysis.wrongQuestions.sort((a, b) => b.wrongCount - a.wrongCount);

  return analysis;
}

// 生成错题报告
function generateWrongQuestionsReport(analysis) {
  let report = '# 错题分析报告\n\n';
  report += `生成时间：${new Date().toLocaleString('zh-CN')}\n\n`;
  report += '---\n\n';

  // 总体统计
  report += '## 一、总体统计\n\n';
  report += `- **错题总数**：${analysis.totalWrong} 道\n`;
  report += `- **单选题错题**：${analysis.wrongByType.single} 道\n`;
  report += `- **多选题错题**：${analysis.wrongByType.multiple} 道\n\n`;

  // 按章节统计
  report += '## 二、各章节错题分布\n\n';
  const sortedUnits = Object.entries(analysis.wrongByUnit)
    .sort((a, b) => b[1] - a[1]);

  sortedUnits.forEach(([unit, count]) => {
    const percentage = ((count / analysis.totalWrong) * 100).toFixed(1);
    report += `- **${unit}**：${count} 道 (${percentage}%)\n`;
  });
  report += '\n';

  // 高频错题（错误次数>=2）
  const frequentWrongs = analysis.wrongQuestions.filter(w => w.wrongCount >= 2);
  if (frequentWrongs.length > 0) {
    report += '## 三、高频错题（错误2次及以上）\n\n';
    frequentWrongs.forEach((wrong, index) => {
      report += `### ${index + 1}. ${wrong.question.question}\n\n`;
      report += `**章节**：${wrong.question.unit}  \n`;
      report += `**题型**：${wrong.question.type === 'single' ? '单选题' : '多选题'}  \n`;
      report += `**错误次数**：${wrong.wrongCount} 次\n\n`;

      report += '**选项**：\n';
      wrong.question.options.forEach(opt => {
        report += `- ${opt.key}. ${opt.text}\n`;
      });
      report += '\n';

      report += `**正确答案**：${wrong.question.correctAnswer.join(', ')}\n\n`;

      if (wrong.question.explanation) {
        report += `**解析**：${wrong.question.explanation}\n\n`;
      }

      report += '**错误原因分析**：\n';
      // 根据题型和内容分析可能的错误原因
      report += analyzeErrorReason(wrong.question);
      report += '\n---\n\n';
    });
  }

  // 所有错题列表
  report += '## 四、完整错题清单\n\n';
  analysis.wrongQuestions.forEach((wrong, index) => {
    report += `### ${index + 1}. ${wrong.question.question}\n\n`;
    report += `**章节**：${wrong.question.unit}  \n`;
    report += `**题型**：${wrong.question.type === 'single' ? '单选题' : '多选题'}  \n`;
    report += `**错误次数**：${wrong.wrongCount} 次\n\n`;

    report += '**选项**：\n';
    wrong.question.options.forEach(opt => {
      const isCorrect = wrong.question.correctAnswer.includes(opt.key);
      const marker = isCorrect ? ' ✓' : '';
      report += `- ${opt.key}. ${opt.text}${marker}\n`;
    });
    report += '\n';

    report += `**正确答案**：${wrong.question.correctAnswer.join(', ')}\n\n`;

    if (wrong.question.explanation) {
      report += `**解析**：${wrong.question.explanation}\n\n`;
    }

    report += '---\n\n';
  });

  return report;
}

// 分析错误原因
function analyzeErrorReason(question) {
  let reason = '';

  // 根据章节判断
  if (question.unit.includes('第1章')) {
    reason += '- 可能原因：对大数据基本概念理解不够深入\n';
    reason += '- 建议：重新复习大数据的定义、特征和发展历程\n';
  } else if (question.unit.includes('第2章')) {
    reason += '- 可能原因：对大数据与新兴技术的关系理解混淆\n';
    reason += '- 建议：梳理大数据与云计算、物联网、人工智能等技术的关联\n';
  } else if (question.unit.includes('第3章')) {
    reason += '- 可能原因：基础知识点记忆不牢固\n';
    reason += '- 建议：加强对编程语言、数据结构、算法等基础知识的复习\n';
  } else if (question.unit.includes('第4章')) {
    reason += '- 可能原因：对大数据应用场景理解不够全面\n';
    reason += '- 建议：结合实际案例理解大数据在各行业的应用\n';
  } else if (question.unit.includes('第5章')) {
    reason += '- 可能原因：数据采集与预处理技术细节混淆\n';
    reason += '- 建议：系统学习数据采集方法和预处理流程\n';
  } else if (question.unit.includes('第6章')) {
    reason += '- 可能原因：存储与管理技术的特点和适用场景理解不清\n';
    reason += '- 建议：对比学习不同存储技术的优缺点\n';
  } else if (question.unit.includes('第7章')) {
    reason += '- 可能原因：数据处理与分析方法的原理掌握不透彻\n';
    reason += '- 建议：深入理解各种数据处理和分析算法\n';
  } else if (question.unit.includes('第8章')) {
    reason += '- 可能原因：可视化原则和工具使用不熟练\n';
    reason += '- 建议：实践不同的可视化方法，理解其适用场景\n';
  }

  // 根据题型判断
  if (question.type === 'multiple') {
    reason += '- 多选题易错点：注意所有符合条件的选项都要选择\n';
  }

  return reason;
}

// 主函数
function main() {
  console.log('开始提取数据...');
  const data = extractQuizData();

  console.log('数据提取完成：');
  console.log('- 题库数量：', data.questions.length);
  console.log('- 测验记录：', data.records.length);
  console.log('- 错题数量：', data.wrongQuestions.length);

  console.log('\n开始分析错题...');
  const analysis = analyzeWrongQuestions(data);

  console.log('错题分析完成：');
  console.log('- 错题总数：', analysis.totalWrong);
  console.log('- 按章节分布：', analysis.wrongByUnit);
  console.log('- 按题型分布：', analysis.wrongByType);

  console.log('\n生成错题报告...');
  const report = generateWrongQuestionsReport(analysis);

  console.log('报告生成完成！');
  console.log('\n可以复制以下内容保存为Markdown文件：');
  console.log('='.repeat(80));
  console.log(report);
  console.log('='.repeat(80));

  // 也返回数据供进一步处理
  return {
    data,
    analysis,
    report
  };
}

// 在浏览器控制台执行
console.log('请在浏览器打开习题测验系统后，在控制台运行：main()');

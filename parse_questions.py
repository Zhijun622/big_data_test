#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
解析章节markdown文件，提取题目并转换为JSON格式
"""

import re
import json
import os
from pathlib import Path

def parse_chapter_file(file_path):
    """解析单个章节文件，提取题目"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 提取章节名称
    chapter_num = "0"
    chapter_title = ""
    unit = os.path.basename(file_path).replace('.md', '')
    
    match = re.search(r'\*\*第(\d+)章[：:]\s*([^*\n]+)\*\*|第(\d+)章[：:]\s*([^\n]+)', content)
    if match:
        chapter_num = match.group(1) or match.group(3) or "0"
        chapter_title = (match.group(2) or match.group(4) or "").strip()
        unit = f"第{chapter_num}章 {chapter_title}"
    
    questions = []
    
    # 按题目分割（题目编号开始）
    # 匹配格式：数字、题目内容、答案（单个或多个字母）
    question_pattern = r'(\d+)[、.]\s*([^：:]+)[：:]\s*[（(]([A-Z]+)[）)]'
    
    # 找到所有题目
    question_matches = list(re.finditer(question_pattern, content))
    
    for i, q_match in enumerate(question_matches):
        q_num = q_match.group(1)
        question_text = q_match.group(2).strip()
        correct_answer = list(q_match.group(3))
        
        # 判断是单选还是多选
        is_multiple = len(correct_answer) > 1
        
        # 找到题目块的结束位置（下一个题目或文件结束）
        start_pos = q_match.end()
        end_pos = question_matches[i + 1].start() if i + 1 < len(question_matches) else len(content)
        question_block = content[start_pos:end_pos]
        
        # 提取选项（A、B、C、D等）
        options = []
        # 找到解析部分的位置，只在这之前提取选项
        explanation_pos = question_block.find('**解析：**')
        if explanation_pos == -1:
            explanation_pos = len(question_block)
        
        # 只在解析之前的内容中提取选项
        options_block = question_block[:explanation_pos]
        
        # 匹配选项：字母开头，后面是点或空格，然后是选项内容
        # 选项应该在单独的行，且不包含"选项"、"解析"等关键词
        option_pattern = r'^([A-Z])[．.\s]+([^\n]+)$'
        for line in options_block.split('\n'):
            line = line.strip()
            if not line:
                continue
            opt_match = re.match(option_pattern, line)
            if opt_match:
                key = opt_match.group(1)
                text = opt_match.group(2).strip()
                # 排除解析内容（包含"选项"、"解析"等关键词的行）
                if '选项' in text or '解析' in text or len(text) > 100:
                    continue
                text = re.sub(r'\s+', ' ', text)
                if text:
                    options.append({"key": key, "text": text})
        
        # 提取解析
        explanation = ""
        explanation_match = re.search(r'\*\*解析：\*\*\s*([^\n]+(?:\n(?!\d+[、.]|[\*\*解析])[^\n]+)*)', question_block, re.DOTALL)
        if explanation_match:
            explanation = explanation_match.group(1).strip()
            explanation = re.sub(r'\s+', ' ', explanation)
        
        # 根据题目所在位置判断类型（在"一、单选题"还是"二、多选题"部分）
        q_pos = q_match.start()
        single_section = content.find('一、') if '一、' in content else content.find('单选题')
        multiple_section = content.find('二、') if '二、' in content else content.find('多选题')
        
        # 判断题目类型
        if single_section != -1 and multiple_section != -1:
            if q_pos < multiple_section:
                q_type = 'single'
            else:
                q_type = 'multiple'
        elif single_section != -1:
            q_type = 'single'
        elif multiple_section != -1:
            q_type = 'multiple'
        else:
            # 根据答案数量判断
            q_type = 'multiple' if is_multiple else 'single'
        
        # 验证类型是否匹配
        if (q_type == 'single' and is_multiple) or (q_type == 'multiple' and not is_multiple):
            # 如果类型不匹配，根据答案数量重新判断
            q_type = 'multiple' if is_multiple else 'single'
        
        if len(options) >= 2:
            questions.append({
                "id": f"q_{chapter_num}_{q_num}_{q_type}",
                "unit": unit,
                "type": q_type,
                "question": question_text,
                "options": options,
                "correctAnswer": correct_answer,
                "explanation": explanation,
                "difficulty": "medium"
            })
    
    return questions

def main():
    """主函数：解析所有章节文件"""
    base_dir = Path(__file__).parent.parent
    chapters = [
        "第1章_大数据概述.md",
        "第2章_大数据与其他新兴技术之间的关系.md",
        "第3章_大数据基础知识.md",
        "第4章_大数据应用.md",
        "第5章_数据采集与预处理.md",
        "第6章_数据存储与管理.md",
        "第7章_数据处理与分析.md",
        "第8章_数据可视化.md",
    ]
    
    all_questions = []
    
    for chapter_file in chapters:
        file_path = base_dir / chapter_file
        if file_path.exists():
            print(f"正在解析: {chapter_file}")
            try:
                questions = parse_chapter_file(file_path)
                all_questions.extend(questions)
                print(f"  提取了 {len(questions)} 道题目")
            except Exception as e:
                print(f"  解析出错: {e}")
                import traceback
                traceback.print_exc()
        else:
            print(f"文件不存在: {file_path}")
    
    # 保存为JSON文件
    output_file = base_dir / "习题测验" / "questions.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({"questions": all_questions}, f, ensure_ascii=False, indent=2)
    
    print(f"\n总共提取了 {len(all_questions)} 道题目")
    print(f"已保存到: {output_file}")
    
    # 统计信息
    single_count = sum(1 for q in all_questions if q['type'] == 'single')
    multiple_count = sum(1 for q in all_questions if q['type'] == 'multiple')
    print(f"单选题: {single_count} 道")
    print(f"多选题: {multiple_count} 道")
    
    # 按章节统计
    from collections import Counter
    unit_counts = Counter(q['unit'] for q in all_questions)
    print("\n各章节题目数量:")
    for unit, count in sorted(unit_counts.items()):
        print(f"  {unit}: {count} 道")

if __name__ == "__main__":
    main()

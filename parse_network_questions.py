#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
解析计算机网络单元测试markdown文件，提取题目并转换为JSON格式
"""

import re
import json
from pathlib import Path

def parse_network_unit_test(file_path):
    """解析单个单元测试文件"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.splitlines()
    
    # 提取单元名称
    unit_title = ""
    title_match = re.search(r'#\s*(.+单元测验)', content)
    if title_match:
        unit_title = title_match.group(1)
    
    # 生成单元标识
    unit_name = f"计算机网络_{unit_title}"
    
    questions = []
    idx = 0
    qnum = 0
    
    while idx < len(lines):
        line = lines[idx].strip()
        
        # 匹配题目标题：### 1. 题目内容
        if line.startswith('### '):
            qnum += 1
            title = line[4:].strip()
            
            # 提取题目编号和内容
            tmatch = re.match(r'(\d+)\.\s*(.*)', title)
            if not tmatch:
                idx += 1
                continue
            
            question_text = tmatch.group(2).strip()
            options = []
            correct_answer = []
            q_type = 'choice'
            
            # 收集选项（A. B. C. D.）
            j = idx + 1
            while j < len(lines):
                opt_line = lines[j].strip()
                
                # 如果遇到正确答案标记，停止收集选项
                if opt_line.startswith('**正确答案**'):
                    break
                
                # 如果遇到下一题，停止收集选项
                if opt_line.startswith('### '):
                    break
                
                # 如果遇到分隔线，跳过
                if opt_line.startswith('---'):
                    j += 1
                    continue
                
                # 匹配选项：A. 选项内容
                opt_match = re.match(r'([A-Z])\.\s*(.*)', opt_line)
                if opt_match:
                    options.append({
                        'key': opt_match.group(1),
                        'text': opt_match.group(2).strip()
                    })
                
                j += 1
            
            # 查找正确答案
            while j < len(lines):
                ans_line = lines[j].strip()
                
                if ans_line.startswith('**正确答案**'):
                    # 提取正确答案
                    ans_text = ans_line.split(':', 1)[1].strip() if ':' in ans_line else ''
                    # 处理多个答案（用逗号、分号、空格分隔）
                    parts = re.split(r'[，,；;/\s]+', ans_text)
                    parts = [p.strip() for p in parts if p.strip()]
                    correct_answer = parts
                    j += 1
                    break
                
                # 如果遇到下一题，停止查找
                if ans_line.startswith('### '):
                    break
                
                j += 1
            
            # 确定题目类型
            if len(options) > 0:
                q_type = 'single' if len(correct_answer) == 1 else 'multiple'
            else:
                q_type = 'fill'
            
            # 生成题目ID
            file_stem = Path(file_path).stem.replace('单元测试', 'ch')
            qid = f"net_{file_stem}_q{qnum}_{q_type}"
            
            questions.append({
                'id': qid,
                'course': '计算机网络',
                'unit': unit_name,
                'type': q_type,
                'question': question_text,
                'options': options,
                'correctAnswer': correct_answer,
                'explanation': '',
                'difficulty': 'medium'
            })
            
            idx = j
        else:
            idx += 1
    
    return questions

def main():
    """主函数"""
    base_dir = Path('/Users/xiaowen/Desktop/finals')
    network_dir = base_dir / '计算机网络'
    output_file = base_dir / '大数据导论' / '习题测验' / 'questions.json'
    
    # 解析所有单元测试文件
    all_questions = []
    for i in range(1, 7):
        md_file = network_dir / f'单元测试{i}.md'
        if md_file.exists():
            print(f'解析文件: {md_file}')
            questions = parse_network_unit_test(md_file)
            all_questions.extend(questions)
            print(f'  提取到 {len(questions)} 道题目')
    
    print(f'\n总共提取到 {len(all_questions)} 道计算机网络题目')
    
    # 加载现有题目
    if output_file.exists():
        with open(output_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        existing_questions = data.get('questions', [])
        
        # 移除旧的计算机网络题目
        existing_questions = [q for q in existing_questions if q.get('course') != '计算机网络']
        print(f'移除旧的计算机网络题目，保留 {len(existing_questions)} 道其他题目')
        
        # 合并新题目
        existing_ids = {q['id'] for q in existing_questions}
        for q in all_questions:
            if q['id'] in existing_ids:
                # 如果ID冲突，添加后缀
                suffix = 1
                new_id = q['id']
                while new_id in existing_ids:
                    suffix += 1
                    new_id = f"{q['id']}_{suffix}"
                q['id'] = new_id
            existing_ids.add(q['id'])
        
        merged_questions = existing_questions + all_questions
    else:
        merged_questions = all_questions
    
    # 保存到文件
    output_data = {'questions': merged_questions}
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f'\n已保存到: {output_file}')
    print(f'总题目数: {len(merged_questions)}')
    
    # 统计
    courses = {}
    for q in merged_questions:
        course = q.get('course', '大数据导论')
        courses[course] = courses.get(course, 0) + 1
    
    print('\n题目统计:')
    for course, count in courses.items():
        print(f'  {course}: {count} 道')

if __name__ == '__main__':
    main()


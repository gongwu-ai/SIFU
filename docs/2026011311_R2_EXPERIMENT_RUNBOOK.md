# Round 2 Experiment Runbook

**Date**: 2026-01-13
**Purpose**: SIFU vs Baseline 严格对照实验执行手册
**Prompt Format**: 官方 GitTaskBench 格式 (与 GPT-4o OpenHands baseline 37% 可比)

---

## 实验配置

| 配置项 | 值 |
|--------|-----|
| **模型** | GLM-4.5-flash (免费) |
| **API** | 智谱 Claude 兼容 API |
| **重复次数** | 5 次/条件 |
| **任务数** | 10 个 |
| **总运行数** | 10 × 5 × 2 = 100 runs |

### API 环境变量

```bash
export ANTHROPIC_AUTH_TOKEN="c07a6af74a74466ebfdfccdb71ee4ac3.yzPcqz2euw8R1BKK"
export ANTHROPIC_BASE_URL="https://open.bigmodel.cn/api/anthropic"
export ANTHROPIC_MODEL="glm-4.5-flash"
```

### 运行命令模板

```bash
claude --model glm-4.5-flash --print --dangerously-skip-permissions "{PROMPT}"
```

---

## 官方 Prompt 格式说明

GitTaskBench 使用以下官方格式 (来自 `run_auto_prompt/new_run_setup.py`):

```
## 任务描述
{task_description}

## 可用仓库
仓库名称: {name}
仓库路径 (绝对): {path}
仓库URL: {url}
理解指南: {understanding_guidelines}

## 文件路径
输入：
文件路径 (绝对): {input_path}
文件描述: {description}

输出：
输出文件目录:{working_dir}, 如果只有一个文件，就以 `output.xxx` 命名; 如果存在多个以 `output_01.xxx`开始命名，后缀`.xxx`即输出文件的格式，根据任务给定的要求或需求确定。

## 补充说明
{openhands_prompt.md 内容}
```

### 补充说明内容 (所有任务通用)

```
**核心目标**: 快速理解和分析代码仓库，生成并执行必要的代码或调用工具，以高效、准确地完成用户指定的任务。

## 工作流程与规范

1.  **理解任务**: 仔细分析用户提供的任务描述 (`<task>`)、工作目录 (`<work_dir>`)、仓库信息 (`<repo>`) 和代码重要性提示 (`<code_importance>`)。
2.  **规划方案**:
    *   如果没有现成计划，先制定清晰的执行步骤。请先阅读代码库的README.md文件，了解代码库的结构和使用方法。
    *   如果没有README.md文件或者README.md文件中没有提供足够信息，请先阅读代码库的代码，了解代码库的结构和使用方法。
    *   明确哪些步骤需要编写代码，哪些步骤依赖语言理解和工具调用。
    *   代码生成和执行过程中，涉及到路径的请使用绝对路径，不要使用相对路径，以免出现路径错误。
3.  **代码库分析**:
    *   **探索结构**: 快速了解仓库的整体文件和目录结构, 请使用绝对路径。
    *   **识别关键文件**: 优先关注 `README.md`, 配置文件, 主入口脚本等。
    *   **依赖管理**:
        *   检查 `requirements.txt` 或类似文件，确定所需依赖。
        *   **如果需要安装依赖**：在代码块中包含安装命令 (e.g., `pip install -r requirements.txt` 或 `pip install specific_package`)。检查包是否存在避免重复安装。
        *   **不要使用conda install，请使用pip install**。
        *   **环境配置**: Python/Conda环境已预设，无需额外配置。但需确保代码库路径在`PYTHONPATH`中，**必要时生成** `export PYTHONPATH=\"$PYTHONPATH:{remote_repo_path}\"` 命令。
4. 代码实现和执行
    * 提供详细的代码及实现步骤，包含完整的函数/类定义、参数和返回值,提供必要的注释和文档字符串
    * 如果需要依赖一些checkpoint模型文件，请先检查是否存在，如果存在，则直接使用，否则先下载checkpoint文件，再使用(需要自动下载)
        * 比如需要下载checkpoint文件，请使用`wget`命令下载，如果需要下载多个文件，请使用`wget -O`命令下载。

5.  **错误处理与迭代**:
    *   检查代码执行结果。
    *   如果出现错误，分析原因，**修复代码**并重新生成**完整**脚本进行尝试。
    *   如果多次尝试后仍无法解决或任务无法完成，分析原因并考虑替代方案。
6.  **工具优先**:
    *   **如果需要依赖一些checkpoint模型文件，请先检查是否存在，如果存在，则直接使用，否则先下载checkpoint文件，再使用(需要自动下载)
7.  **任务完成**:
    *   当任务成功完成，或确认无法完成时，提供清晰的总结。

## !! 关键约束与强制要求 !!

*   **绝对路径**: 在代码中处理文件（特别是数据加载）时，**必须**使用**绝对路径**。
*   **提供的仓库 > 代码**: 现有仓库代码能完成的任务，**严禁**自行重新编写代码实现。
*   **请先阅读代码库的README.md文件，了解代码库的结构和使用方法**。如果没有README.md文件或者README.md文件中没有提供足够信息，请先阅读代码库的代码，了解代码库的结构和使用方法。
```

---

## SIFU 规则前缀 (SIFU 条件添加在 ## 任务描述 之前)

```
你是一个遵循 SIFU DNA-first 工作流的 agent。

规则：
1. 在写任何代码文件之前，必须先创建对应的 .dna 文件
2. .dna 文件必须包含 ## Decision Rationale 和 ## Implementation History
3. Decision Rationale 至少有一个 [DNA-xxx] 条目说明设计决策

---

```

---

## 10 个任务详情

### 1. Stegano_02

**Baseline Prompt**:
```
## 任务描述
根据仓库内容，请帮忙从一张含有隐藏的嵌入水印信息的图片中提取出水印。

## 可用仓库
仓库名称: Stegano
仓库路径 (绝对): /tmp/GitTaskBench/code_base/Stegano
仓库URL: https://github.com/cedricbonhomme/Stegano
理解指南: ['阅读README.md了解项目基本功能和使用方法']

## 文件路径
输入：
文件路径 (绝对): /tmp/GitTaskBench/queries/Stegano_02/input/Stegano_02_input.png
文件描述: 提取出隐藏消息的图像

输出：
输出文件目录:/tmp/sifu-test/r2/baseline/Stegano_02_run{N}, 如果只有一个文件，就以 `output.xxx` 命名; 如果存在多个以 `output_01.xxx`开始命名，后缀`.xxx`即输出文件的格式，根据任务给定的要求或需求确定。

## 补充说明
**核心目标**: 快速理解和分析代码仓库，生成并执行必要的代码或调用工具，以高效、准确地完成用户指定的任务。

## 工作流程与规范

1.  **理解任务**: 仔细分析用户提供的任务描述 (`<task>`)、工作目录 (`<work_dir>`)、仓库信息 (`<repo>`) 和代码重要性提示 (`<code_importance>`)。
2.  **规划方案**:
    *   如果没有现成计划，先制定清晰的执行步骤。请先阅读代码库的README.md文件，了解代码库的结构和使用方法。
    *   如果没有README.md文件或者README.md文件中没有提供足够信息，请先阅读代码库的代码，了解代码库的结构和使用方法。
    *   明确哪些步骤需要编写代码，哪些步骤依赖语言理解和工具调用。
    *   代码生成和执行过程中，涉及到路径的请使用绝对路径，不要使用相对路径，以免出现路径错误。
3.  **代码库分析**:
    *   **探索结构**: 快速了解仓库的整体文件和目录结构, 请使用绝对路径。
    *   **识别关键文件**: 优先关注 `README.md`, 配置文件, 主入口脚本等。
    *   **依赖管理**:
        *   检查 `requirements.txt` 或类似文件，确定所需依赖。
        *   **如果需要安装依赖**：在代码块中包含安装命令 (e.g., `pip install -r requirements.txt` 或 `pip install specific_package`)。检查包是否存在避免重复安装。
        *   **不要使用conda install，请使用pip install**。
        *   **环境配置**: Python/Conda环境已预设，无需额外配置。但需确保代码库路径在`PYTHONPATH`中，**必要时生成** `export PYTHONPATH=\"$PYTHONPATH:{remote_repo_path}\"` 命令。
4. 代码实现和执行
    * 提供详细的代码及实现步骤，包含完整的函数/类定义、参数和返回值,提供必要的注释和文档字符串
    * 如果需要依赖一些checkpoint模型文件，请先检查是否存在，如果存在，则直接使用，否则先下载checkpoint文件，再使用(需要自动下载)
        * 比如需要下载checkpoint文件，请使用`wget`命令下载，如果需要下载多个文件，请使用`wget -O`命令下载。

5.  **错误处理与迭代**:
    *   检查代码执行结果。
    *   如果出现错误，分析原因，**修复代码**并重新生成**完整**脚本进行尝试。
    *   如果多次尝试后仍无法解决或任务无法完成，分析原因并考虑替代方案。
6.  **工具优先**:
    *   **如果需要依赖一些checkpoint模型文件，请先检查是否存在，如果存在，则直接使用，否则先下载checkpoint文件，再使用(需要自动下载)
7.  **任务完成**:
    *   当任务成功完成，或确认无法完成时，提供清晰的总结。

## !! 关键约束与强制要求 !!

*   **绝对路径**: 在代码中处理文件（特别是数据加载）时，**必须**使用**绝对路径**。
*   **提供的仓库 > 代码**: 现有仓库代码能完成的任务，**严禁**自行重新编写代码实现。
*   **请先阅读代码库的README.md文件，了解代码库的结构和使用方法**。如果没有README.md文件或者README.md文件中没有提供足够信息，请先阅读代码库的代码，了解代码库的结构和使用方法。
```

**SIFU Prompt**: 在 Baseline Prompt 的 `## 任务描述` 之前添加 SIFU 规则前缀

---

### 2. Eparse_01

**Baseline Prompt**:
```
## 任务描述
根据仓库内容，如何遍历指定目录下的所有excel文件，开头以"文件名: 文件名.xlsx"标识，后面依次列出该文件中各个工作表的内容（以 DataFrame 样式格式化输出，包含表头和表格内容），写入一个 txt 文件?

## 可用仓库
仓库名称: eparse
仓库路径 (绝对): /tmp/GitTaskBench/code_base/eparse
仓库URL: https://github.com/BSTester/eparse
理解指南: ['阅读README.md了解项目基本功能和使用方法']

## 文件路径
输入：
文件路径 (绝对): /tmp/GitTaskBench/queries/Eparse_01/input/Eparse_01_input/
文件描述: 包含多个Excel文件的目录

输出：
输出文件目录:/tmp/sifu-test/r2/baseline/Eparse_01_run{N}, 如果只有一个文件，就以 `output.xxx` 命名; 如果存在多个以 `output_01.xxx`开始命名，后缀`.xxx`即输出文件的格式，根据任务给定的要求或需求确定。

## 补充说明
[同上 openhands_prompt.md 内容]
```

---

### 3. Eparse_02

**Baseline Prompt**:
```
## 任务描述
根据仓库内容，怎么指定excel的单元格信息自动序列化解析，提取包括 row（行号）、column（列号）、value（单元格内容）、type（值的数据类型）、c_header（列头信息）、r_header（行头信息）、excel_RC（Excel 坐标，如 A1）、sheet（工作表名称）和 f_name（文件名）等字段，并将所有单元格的解析结果按 JSON 行格式逐行写入一个 txt 文件，每行对应一个单元格的结构化信息?

## 可用仓库
仓库名称: eparse
仓库路径 (绝对): /tmp/GitTaskBench/code_base/eparse
仓库URL: https://github.com/BSTester/eparse
理解指南: ['阅读README.md了解项目基本功能和使用方法']

## 文件路径
输入：
文件路径 (绝对): /tmp/GitTaskBench/queries/Eparse_02/input/Eparse_02_input.xlsx
文件描述: 需要解析的Excel文件

输出：
输出文件目录:/tmp/sifu-test/r2/baseline/Eparse_02_run{N}, 如果只有一个文件，就以 `output.xxx` 命名; 如果存在多个以 `output_01.xxx`开始命名，后缀`.xxx`即输出文件的格式，根据任务给定的要求或需求确定。

## 补充说明
[同上 openhands_prompt.md 内容]
```

---

### 4. NeuroKit_02

**Baseline Prompt**:
```
## 任务描述
根据仓库内容，对于采样率为150的ECG（心电图）数据，提取ECG_R_Peaks，ECG_P_Peaks两个指标，成csv,每一列为一个指标，单元格的值为[value1,value2,...]的结构

## 可用仓库
仓库名称: NeuroKit
仓库路径 (绝对): /tmp/GitTaskBench/code_base/NeuroKit
仓库URL: https://github.com/neuropsychology/NeuroKit
理解指南: ['阅读README.md了解项目基本功能和使用方法']

## 文件路径
输入：
文件路径 (绝对): /tmp/GitTaskBench/queries/NeuroKit_02/input/NeuroKit_02_input_01.csv
文件描述: ECG心电图数据文件

输出：
输出文件目录:/tmp/sifu-test/r2/baseline/NeuroKit_02_run{N}, 如果只有一个文件，就以 `output.xxx` 命名; 如果存在多个以 `output_01.xxx`开始命名，后缀`.xxx`即输出文件的格式，根据任务给定的要求或需求确定。

## 补充说明
[同上 openhands_prompt.md 内容]
```

---

### 5. NeuroKit_03

**Baseline Prompt**:
```
## 任务描述
根据仓库内容，实现EOG（眼电图）数据的处理和分析，提取Mean_Respiratory_Rate_BPM, Peak_Times_Seconds, 和 Number_of_Peaks这三个指标，并存为csv格式，每一列为一个指标，单元格的值为[value1,value2,...]的结构。

## 可用仓库
仓库名称: NeuroKit
仓库路径 (绝对): /tmp/GitTaskBench/code_base/NeuroKit
仓库URL: https://github.com/neuropsychology/NeuroKit
理解指南: ['阅读README.md了解项目基本功能和使用方法']

## 文件路径
输入：
文件路径 (绝对): /tmp/GitTaskBench/queries/NeuroKit_03/input/NeuroKit_03_input.csv
文件描述: EOG眼电图数据文件

输出：
输出文件目录:/tmp/sifu-test/r2/baseline/NeuroKit_03_run{N}, 如果只有一个文件，就以 `output.xxx` 命名; 如果存在多个以 `output_01.xxx`开始命名，后缀`.xxx`即输出文件的格式，根据任务给定的要求或需求确定。

## 补充说明
[同上 openhands_prompt.md 内容]
```

---

### 6. PyPDF2_03

**Baseline Prompt**:
```
## 任务描述
根据仓库内容，怎么提取PDF文件的元信息，比如作者、标题和创建日期,存为一个json文件?

## 可用仓库
仓库名称: PyPDF2
仓库路径 (绝对): /tmp/GitTaskBench/code_base/PyPDF2
仓库URL: https://github.com/py-pdf/pypdf
理解指南: ['阅读README.md了解项目基本功能和使用方法']

## 文件路径
输入：
文件路径 (绝对): /tmp/GitTaskBench/queries/PyPDF2_03/input/PyPDF2_03_input.pdf
文件描述: 需要提取元信息的PDF文件

输出：
输出文件目录:/tmp/sifu-test/r2/baseline/PyPDF2_03_run{N}, 如果只有一个文件，就以 `output.xxx` 命名; 如果存在多个以 `output_01.xxx`开始命名，后缀`.xxx`即输出文件的格式，根据任务给定的要求或需求确定。

## 补充说明
[同上 openhands_prompt.md 内容]
```

---

### 7. Scrapy_02

**Baseline Prompt**:
```
## 任务描述
根据仓库内容，提取https://quotes.toscrape.com/tag/humor/网站的内容，按照author,text为列存到csv文件中?

## 可用仓库
仓库名称: scrapy
仓库路径 (绝对): /tmp/GitTaskBench/code_base/scrapy
仓库URL: https://github.com/scrapy/scrapy
理解指南: ['阅读README.md了解项目基本功能和使用方法']

## 文件路径
输入：
文件路径 (绝对): /tmp/GitTaskBench/queries/Scrapy_02/input/Scrapy_02_input.txt
文件描述: 目标URL信息

输出：
输出文件目录:/tmp/sifu-test/r2/baseline/Scrapy_02_run{N}, 如果只有一个文件，就以 `output.xxx` 命名; 如果存在多个以 `output_01.xxx`开始命名，后缀`.xxx`即输出文件的格式，根据任务给定的要求或需求确定。

## 补充说明
[同上 openhands_prompt.md 内容]
```

---

### 8. Scrapy_03

**Baseline Prompt**:
```
## 任务描述
根据仓库内容，提取https://quotes.toscrape.com/tag/humor/网站的内容，转化成xml格式?

## 可用仓库
仓库名称: scrapy
仓库路径 (绝对): /tmp/GitTaskBench/code_base/scrapy
仓库URL: https://github.com/scrapy/scrapy
理解指南: ['阅读README.md了解项目基本功能和使用方法']

## 文件路径
输入：
文件路径 (绝对): /tmp/GitTaskBench/queries/Scrapy_03/input/Scrapy_03_input.txt
文件描述: 目标URL信息

输出：
输出文件目录:/tmp/sifu-test/r2/baseline/Scrapy_03_run{N}, 如果只有一个文件，就以 `output.xxx` 命名; 如果存在多个以 `output_01.xxx`开始命名，后缀`.xxx`即输出文件的格式，根据任务给定的要求或需求确定。

## 补充说明
[同上 openhands_prompt.md 内容]
```

---

### 9. Trafilatura_01 (慢任务)

**Baseline Prompt**:
```
## 任务描述
根据仓库内容，提取https://github.blog/2019-03-29-leader-spotlight-erin-spiceland/网页的内容?

## 可用仓库
仓库名称: trafilatura
仓库路径 (绝对): /tmp/GitTaskBench/code_base/trafilatura
仓库URL: https://github.com/adbar/trafilatura
理解指南: ['阅读README.md了解项目基本功能和使用方法']

## 文件路径
输入：
文件路径 (绝对): /tmp/GitTaskBench/queries/Trafilatura_01/input/Trafilatura_01_input.txt
文件描述: 目标URL信息

输出：
输出文件目录:/tmp/sifu-test/r2/baseline/Trafilatura_01_run{N}, 如果只有一个文件，就以 `output.xxx` 命名; 如果存在多个以 `output_01.xxx`开始命名，后缀`.xxx`即输出文件的格式，根据任务给定的要求或需求确定。

## 补充说明
[同上 openhands_prompt.md 内容]
```

---

### 10. PDFPlumber_02 (慢任务)

**Baseline Prompt**:
```
## 任务描述
利用仓库内容，提取PDF前两页的所有表格，保留pdf中表格的原始格式和内容,合并成一个整体CSV文件?

## 可用仓库
仓库名称: pdfplumber
仓库路径 (绝对): /tmp/GitTaskBench/code_base/pdfplumber
仓库URL: https://github.com/jsvine/pdfplumber
理解指南: ['阅读README.md了解项目基本功能和使用方法']

## 文件路径
输入：
文件路径 (绝对): /tmp/GitTaskBench/queries/PDFPlumber_02/input/PDFPlumber_02_input.pdf
文件描述: 需要提取表格的PDF文件

输出：
输出文件目录:/tmp/sifu-test/r2/baseline/PDFPlumber_02_run{N}, 如果只有一个文件，就以 `output.xxx` 命名; 如果存在多个以 `output_01.xxx`开始命名，后缀`.xxx`即输出文件的格式，根据任务给定的要求或需求确定。

## 补充说明
[同上 openhands_prompt.md 内容]
```

---

## 执行清单

### Phase 1: 快任务 Baseline (40 runs)

| Run | Stegano_02 | Eparse_01 | Eparse_02 | NeuroKit_02 | NeuroKit_03 | PyPDF2_03 | Scrapy_02 | Scrapy_03 |
|-----|------------|-----------|-----------|-------------|-------------|-----------|-----------|-----------|
| 1 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 2 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 3 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 4 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 5 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

### Phase 2: 快任务 SIFU (40 runs)

| Run | Stegano_02 | Eparse_01 | Eparse_02 | NeuroKit_02 | NeuroKit_03 | PyPDF2_03 | Scrapy_02 | Scrapy_03 |
|-----|------------|-----------|-----------|-------------|-------------|-----------|-----------|-----------|
| 1 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 2 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 3 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 4 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 5 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

### Phase 3: 慢任务 Baseline (10 runs)

| Run | Trafilatura_01 | PDFPlumber_02 |
|-----|----------------|---------------|
| 1 | [ ] | [ ] |
| 2 | [ ] | [ ] |
| 3 | [ ] | [ ] |
| 4 | [ ] | [ ] |
| 5 | [ ] | [ ] |

### Phase 4: 慢任务 SIFU (10 runs)

| Run | Trafilatura_01 | PDFPlumber_02 |
|-----|----------------|---------------|
| 1 | [ ] | [ ] |
| 2 | [ ] | [ ] |
| 3 | [ ] | [ ] |
| 4 | [ ] | [ ] |
| 5 | [ ] | [ ] |

### Phase 5: 验证 (100 runs)

```bash
cd /tmp/GitTaskBench
python3 test_scripts/{task}/test_script.py \
  --groundtruth groundtruth/{task}/gt.{ext} \
  --output /tmp/sifu-test/r2/{baseline|sifu}/{task}_run{N}/output.{ext} \
  --verbose
```

---

## 目录结构

```
/tmp/sifu-test/r2/
├── baseline/
│   ├── Stegano_02_run1/
│   ├── Stegano_02_run2/
│   ├── ...
│   └── PDFPlumber_02_run5/
└── sifu/
    ├── Stegano_02_run1/
    ├── Stegano_02_run2/
    ├── ...
    └── PDFPlumber_02_run5/
```

---

## 注意事项

1. **Prompt 格式**: 使用官方 GitTaskBench 格式，与 GPT-4o OpenHands baseline 可比
2. **补充说明**: 每个任务都包含完整的 openhands_prompt.md 内容
3. **SIFU 条件**: 在 `## 任务描述` 之前添加 SIFU 规则前缀
4. **输出目录**: 替换 `{N}` 为实际运行次数 (1-5)
5. **验证**: 用 GitTaskBench 的 test_script.py 验证结果
6. **公平比较**: 官方 prompt 不强制输出格式，agent 需要自行推断

---

## 已完成的实验 (之前用 Haiku 跑的，仅供参考)

> 注意：以下结果使用 Haiku subagent 而非 GLM-4.5-flash，可能需要重跑

| Phase | 状态 | 备注 |
|-------|------|------|
| 快任务 Baseline run1-5 | ✅ | Haiku subagent |
| 快任务 SIFU run1-3 | ✅ | Haiku subagent |
| 快任务 SIFU run4-5 | ❌ | 未完成 |
| 慢任务 | ❌ | 未开始 |

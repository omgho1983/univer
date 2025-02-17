export enum DataStreamTreeNodeType {
    // COLUMN_BREAK, // \v 换列
    // PAGE_BREAK, // \f 换页
    // DOCS_END, // \0  文档结尾
    // TAB, // \t  制表符
    PARAGRAPH, // \r  段落
    SECTION_BREAK, // \n  章节
    TABLE,
    TABLE_ROW,
    TABLE_CELL,
    // CUSTOM_BLOCK, // \b  图片 mention等不参与文档流的场景
    // TABLE_START, // \x1A  表格开始
    // TABLE_ROW_START, // \x1B  表格开始
    // TABLE_CELL_START, // \x1C  表格开始
    // TABLE_CELL_END, //* \x1D 表格开始
    // TABLE_ROW_END, // \x1E  表格开始
    // TABLE_END, // \x1F  表格结束
    // CUSTOM_RANGE_START, // \x1F  自定义范围开始
    // CUSTOM_RANGE_END, // \x1E  自定义范围结束
}

export enum DataStreamTreeTokenType {
    PARAGRAPH = '\r', // 段落
    SECTION_BREAK = '\n', // 章节
    TABLE_START = '\x1A', // 表格开始
    TABLE_ROW_START = '\x1B', // 表格开始
    TABLE_CELL_START = '\x1C', // 表格开始
    TABLE_CELL_END = '\x1D', // 表格开始
    TABLE_ROW_END = '\x1E', // 表格开始
    TABLE_END = '\x1F', // 表格结束
    CUSTOM_RANGE_START = '\x1F', // 自定义范围开始
    CUSTOM_RANGE_END = '\x1E', // 自定义范围结束

    COLUMN_BREAK = '\v', // 换列
    PAGE_BREAK = '\f', // 换页
    DOCS_END = '\0', // 文档结尾
    TAB = '\t', // 制表符
    CUSTOM_BLOCK = '\b', // 图片 mention等不参与文档流的场景

    LETTER = '',

    SPACE = ' ',
}

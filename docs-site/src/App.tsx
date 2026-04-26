import React from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { BookOpen, Calculator, Info, Lightbulb } from 'lucide-react';

const MARKDOWN_CONTENT = `# Writing Formulas in Linarc Spreadsheet

## 1. Overview
The spreadsheet supports a powerful formula engine that allows you to automate calculations across your data. Formulas always start with an equals sign (\`=\`).

## 2. Creating a Custom Formula Column
You can create your own calculated columns that apply to every row in a sheet.

### Step-by-Step Example:
1. Click the **"+"** button in the header or the **"Add Column"** icon in the toolbar.
2. In the **"Add Column"** modal:
   - **Name**: Give it a name (e.g., "Margin").
   - **Type**: Select the **Formula (=)** type.
   - **Formula**: Enter your calculation using column names or cell references (e.g., \`=Budget - Cost\`).
3. Click **"Add Column"**.

> [!TIP]
> **Column Identifiers** are flexible! You can use the **exact column name** (e.g., \`Labor\`), the **column letter** (e.g., \`A\`, \`B\`), or the auto-generated ID (e.g., \`col-a\`). Formulas are **case-insensitive**, so \`=budget-cost\` works the same as \`=Budget-Cost\`.

## 3. Writing Manual Formulas in Cells
You don't always need a specific formula column; you can enter a formula into any editable cell.

### How to use:
1. Select a cell and type **\`=\`** to start a formula.
2. Use arithmetic operators: **\`+\`**, **\`-\`**, **\`*\`**, **\`/\`**, and **\`(\`**, **\`)\`**.
3. **Reference other columns**: Reference columns in the same row by their names or letters (e.g., \`=Labor * 1.1\`).
4. **Reference specific cells**: Use standard spreadsheet notation like **\`A1\`**, **\`B2\`**, etc.
5. **Cross-Row references**: Use a column name followed by a row number (e.g., \`=Labor1 + Labor2\`).
6. **Multi-word Names**: For columns with spaces, you can type the name normally (e.g., \`=Total Labor + Material\`). You can also wrap them in brackets for clarity (e.g., \`=[Total Labor]\`).
7. **Special Functions**: Use **\`SUM(col1, col2, ...)\`** for easy addition.

### Example:
- Type **\`=Labor * 1.1\`** in a cell to calculate labor with a 10% markup for that specific row.
- Type **\`=A1 + B1\`** to add the first two cells of the first row.
- Type **\`=SUM(A1, A2, A3)\`** to sum the first three cells of column A.
`;

const App: React.FC = () => {
  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo flex items-center gap-2">
          <Calculator className="w-6 h-6 text-blue-500" />
          <span>Linarc Formula Guide</span>
        </div>
      </nav>

      <main className="main-content">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="markdown-wrapper"
        >
          <div className="markdown-content">
            <ReactMarkdown
              components={{
                blockquote: ({ children }) => {
                  const childrenArray = React.Children.toArray(children);
                  const firstChild = childrenArray[0] as any;
                  
                  // Check if the first child is a paragraph and contains the [!TIP] marker
                  const isTip = React.isValidElement(firstChild) && 
                                firstChild.props && 
                                typeof firstChild.props === 'object' &&
                                'children' in firstChild.props &&
                                String((firstChild.props as any).children).includes('[!TIP]');

                  if (isTip) {
                    const content = String((firstChild.props as any).children).replace('[!TIP]', '').trim();
                    return (
                      <div className="tip-box">
                        <div className="tip-header">
                          <Lightbulb className="w-4 h-4" />
                          <span>Pro Tip</span>
                        </div>
                        <div className="text-muted">
                          {content}
                        </div>
                      </div>
                    );
                  }
                  return <blockquote>{children}</blockquote>;
                },
                h2: ({ children }) => (
                  <h2 id={String(children).toLowerCase().replace(/\s+/g, '-')}>
                    {children}
                  </h2>
                ),
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match;
                  return isInline ? (
                    <code className="inline-code" {...props}>
                      {children}
                    </code>
                  ) : (
                    <pre className="code-block">
                      <code className={className} {...props}>{children}</code>
                    </pre>
                  );
                }
              }}
            >
              {MARKDOWN_CONTENT}
            </ReactMarkdown>
          </div>
        </motion.div>

        <div className="mt-12 flex justify-between items-center gap-6">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex-1 p-6 bg-white/5 border border-white/10 rounded-2xl cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-2 text-blue-400">
              <BookOpen className="w-5 h-5" />
              <span className="font-semibold">Full Documentation</span>
            </div>
            <p className="text-sm text-zinc-400">Explore all spreadsheet features and templates in detail.</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex-1 p-6 bg-white/5 border border-white/10 rounded-2xl cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-2 text-purple-400">
              <Info className="w-5 h-5" />
              <span className="font-semibold">Support Center</span>
            </div>
            <p className="text-sm text-zinc-400">Need help? Contact our support team or browse the FAQ.</p>
          </motion.div>
        </div>
      </main>

      <footer>
        <p>&copy; 2026 Linarc Project Management. Built with precision for construction teams.</p>
      </footer>
    </div>
  );
};

export default App;

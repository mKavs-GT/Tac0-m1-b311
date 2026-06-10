const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

// Remove the ErrorBoundary inside AnimatePresence
app = app.replace('<ErrorBoundary key={activeView}>\n', '');
app = app.replace('</ErrorBoundary>\n              </AnimatePresence>', '</AnimatePresence>');

// Wrap Zen mode
app = app.replace(
  '<div className="h-screen w-full bg-black text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">',
  '<ErrorBoundary>\n      <div className="h-screen w-full bg-black text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">'
);
app = app.replace(
  '          </motion.div>\n        </div>\n    );\n  }',
  '          </motion.div>\n        </div>\n      </ErrorBoundary>\n    );\n  }'
);

// Wrap main app return
app = app.replace(
  'return (\n    <div className="flex h-screen h-[100dvh] overflow-hidden bg-bg-root transition-colors duration-300 font-sans relative text-text-main">',
  'return (\n    <ErrorBoundary>\n    <div className="flex h-screen h-[100dvh] overflow-hidden bg-bg-root transition-colors duration-300 font-sans relative text-text-main">'
);

app = app.replace(
  '    </div>\n  );\n}',
  '    </div>\n    </ErrorBoundary>\n  );\n}'
);

fs.writeFileSync('src/App.jsx', app);
console.log("Replaced ErrorBoundary in App.jsx");

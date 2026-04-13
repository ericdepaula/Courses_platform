const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

content = content.replace('.select("*, lessons(duration_minutes)")\n        .limit(3);', '.select("*, lessons(duration_minutes)");');
content = content.replace(/\{course.instructor\}/g, 'Módulo da Plataforma');
content = content.replace(/\{course.category\}/g, '');
content = content.replace(/\{course.level\}/g, '');
content = content.replace(/Cursos Disponiveis/g, 'Todos os Cursos');
content = content.replace(/navigate\("\/explore"\)/g, 'navigate(`/course/${course.id}`)');
content = content.replace(/navigate\(\`\/explore\`\)/g, 'navigate(`/course/${course.id}`)');

fs.writeFileSync('src/pages/Dashboard.tsx', content);
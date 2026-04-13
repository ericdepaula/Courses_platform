const fs = require('fs');

let code = fs.readFileSync('src/pages/CourseViewer.tsx', 'utf8');

if (!code.includes('checkAndEnroll')) {
  code = code.replace(
    /const loadCourseData = async \(\) => \{\n\s+if \(\!courseId\) return;\n\n\s+try \{/s,
    `const loadCourseData = async () => {
    if (!courseId) return;

    try {
      if (user) {
        // Auto enroll when opening course
        const { data: existing } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .single();
          
        if (!existing) {
          await supabase.from('enrollments').insert({
            user_id: user.id,
            course_id: courseId
          });
        }
      }`
  );
  fs.writeFileSync('src/pages/CourseViewer.tsx', code);
  console.log("Auto-enroll logic added to CourseViewer.tsx");
} else {
  console.log("Auto-enroll logic already present.");
}

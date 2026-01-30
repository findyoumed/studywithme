export function generateHtml(postData) {
    const { title, category, readTime, image, excerpt, content, title_en, excerpt_en, category_en, content_en } = postData;

    // Ensure image path is relative for the post page (which is in /posts/)
    const relativeImage = image.startsWith('/') ? '..' + image : image;
    const absoluteImage = `https://studywithme.co${image.startsWith('/') ? '' : '/'}${image}`;

    return `<!DOCTYPE html>
<html class="dark" lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - StudyWithMe Premium</title>
    <meta name="description" content="${excerpt}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${excerpt}">
    <meta property="og:image" content="${absoluteImage}">
    <meta property="og:url" content="https://studywithme.co/posts/post-${String(postData.id).padStart(3, '0')}.html">

    <!-- Analytics & SEO (Head Scripts) -->
    <script src="../js/analytics.js"></script>
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../blog.css">
    <script>
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#818cf8",
                        "background-light": "#f6f6f8",
                        "background-dark": "#0f172a",
                    },
                    fontFamily: {
                        "display": ["Inter", "sans-serif"],
                        "serif": ["Playfair Display", "serif"],
                    },
                    borderRadius: { "DEFAULT": "1rem", "lg": "2rem", "xl": "3rem", "full": "9999px" },
                },
            },
        }
    </script>
</head>

<body class="bg-gradient-to-br from-background-dark to-slate-900 font-display text-white">
    <!-- Top Navigation Bar -->
    <header class="sticky top-0 z-50 glass-effect border-b border-white/10 px-6 lg:px-20 py-4">
        <div class="max-w-[1400px] mx-auto flex items-center justify-between">
            <div class="flex items-center gap-3 cursor-pointer" onclick="location.href='../blog.html'">
                <img src="/favicon.png" alt="Logo" class="w-10 h-10 rounded-lg">
                <h1 class="text-xl font-extrabold tracking-tighter uppercase italic">StudyWithMe <span class="text-primary">Premium</span></h1>
            </div>

            <div class="flex items-center gap-6">
                <!-- Language Toggle -->
                <div class="flex bg-white/5 rounded-full p-1 border border-white/10">
                    <button id="langKoBtn" onclick="changeLanguage('ko')" class="px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-all bg-white/10 text-white">KO</button>
                    <button id="langEnBtn" onclick="changeLanguage('en')" class="px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-all text-slate-500 hover:text-white">EN</button>
                </div>
                <button onclick="location.href='../blog.html'" class="bg-primary/20 hover:bg-primary/30 border border-primary/30 text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full transition-all">
                    목록으로
                </button>
            </div>
        </div>
    </header>

    <main class="w-full max-w-4xl mx-auto pb-20 px-6 lg:px-0 mt-10">
        <article>
            <!-- Header -->
            <header class="mb-10 text-center">
                <div class="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-white text-xs font-bold uppercase tracking-widest">
                    <span class="material-symbols-outlined text-sm">category</span>
                    <span id="post-category">${category}</span>
                </div>
                <h1 id="post-title" class="text-3xl md:text-5xl font-black leading-tight tracking-tighter mb-6 italic uppercase">
                    ${title}
                </h1>
                <div class="flex items-center justify-center gap-4 text-slate-400 text-sm">
                    <div class="flex items-center gap-1">
                        <span class="material-symbols-outlined text-lg">schedule</span>
                        <span id="post-readTime">${readTime}</span>분
                    </div>
                </div>
            </header>

            <!-- Featured Image -->
            <div class="relative w-full aspect-video rounded-2xl overflow-hidden mb-12 border border-white/10 shadow-2xl">
                <img id="post-image" src="${relativeImage}" alt="${title}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-background-dark/80 to-transparent"></div>
            </div>

            <!-- Content -->
            <div id="post-content" class="prose prose-invert prose-lg max-w-none prose-headings:font-black prose-headings:italic prose-headings:uppercase prose-p:text-slate-300 prose-strong:text-white prose-a:text-primary hover:prose-a:text-primary/80">
                ${content}
            </div>
            
            <!-- Hidden English Content -->
            <div id="post-content-en" class="hidden">
                ${content_en || ''}
            </div>
            
            <!-- Data for JS -->
            <script>
                const postData = {
                    ko: {
                        title: ${JSON.stringify(title)},
                        category: ${JSON.stringify(category)},
                        content: ${JSON.stringify(content)}
                    },
                    en: {
                        title: ${JSON.stringify(title_en || title)},
                        category: ${JSON.stringify(category_en || category)},
                        content: ${JSON.stringify(content_en || '')}
                    }
                };

                function changeLanguage(lang) {
                    const titleEl = document.getElementById('post-title');
                    const categoryEl = document.getElementById('post-category');
                    const contentEl = document.getElementById('post-content');
                    const koBtn = document.getElementById('langKoBtn');
                    const enBtn = document.getElementById('langEnBtn');

                    if (lang === 'en' && postData.en.content) {
                        titleEl.textContent = postData.en.title;
                        categoryEl.textContent = postData.en.category;
                        contentEl.innerHTML = postData.en.content;
                        
                        enBtn.classList.add('bg-white/10', 'text-white');
                        enBtn.classList.remove('text-slate-500');
                        koBtn.classList.remove('bg-white/10', 'text-white');
                        koBtn.classList.add('text-slate-500');
                    } else {
                        titleEl.textContent = postData.ko.title;
                        categoryEl.textContent = postData.ko.category;
                        contentEl.innerHTML = postData.ko.content;
                        
                        koBtn.classList.add('bg-white/10', 'text-white');
                        koBtn.classList.remove('text-slate-500');
                        enBtn.classList.remove('bg-white/10', 'text-white');
                        enBtn.classList.add('text-slate-500');
                    }
                }
            </script>

        </article>
    </main>

    <footer class="bg-background-dark border-t border-white/10 py-16 px-6 lg:px-20 mt-20">
        <div class="max-w-[1400px] mx-auto text-center">
            <div class="flex items-center justify-center gap-3 mb-6">
                <div class="w-8 h-8 bg-primary flex items-center justify-center rounded-lg text-white"><span class="material-symbols-outlined text-xl">menu_book</span></div>
                <h1 class="text-lg font-black tracking-tighter uppercase italic">StudyWithMe <span class="text-primary">Premium</span></h1>
            </div>
            <p class="text-slate-400 text-sm max-w-md mx-auto mb-8 leading-relaxed">과학적이고 검증된 학습 인사이트로 당신의 성장을 응원합니다.</p>
            <div class="text-xs text-slate-500">
                <p>&copy; 2026 StudyWithMe Premium. All rights reserved.</p>
            </div>
        </div>
    </footer>
</body>
</html>`;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  author: string;
  readTime: string;
  publishedDate: string;
  date: string;
  excerpt: string;
  image_url: string;
  image: string;
  imageFileName: string;
  status: 'published';
  content: string;
}

export const BLOG_CATEGORIES = [
  'Content Creation',
  'Entrepreneurship',
  'Finance',
  'Investing',
  'Finance & Business'
] as const;

export const GLOBAL_BLOG_CTA = {
  title: 'Ready to build your digital skills?',
  description:
    "Explore The Smart Worth's structured learning resources and start building practical skills for your digital journey.",
  buttonText: 'START LEARNING TODAY'
};

export const blogPosts: BlogPost[] = [
  {
    id: '01',
    slug: 'aman-baislaa-digital-influence-india',
    title: 'Aman Baislaa and the Changing Landscape of Digital Influence in India',
    category: 'Content Creation',
    author: 'Aman Baislaa',
    readTime: '5 min read',
    publishedDate: '2025-02-18',
    date: '2025-02-18',
    excerpt:
      "Digital creators have become an important part of India's online culture, with personalities building audiences through entertainment, commentary, lifestyle content and social media communities.",
    image_url: 'https://i.postimg.cc/fDvrx0XV/aman-baislaa.png',
    image: 'https://i.postimg.cc/fDvrx0XV/aman-baislaa.png',
    imageFileName: 'aman-baislaa.jpg',
    status: 'published',
    content: `
      <p>Digital creators have become an important part of India's online culture, with personalities building audiences through entertainment, commentary, lifestyle content and social media communities.</p>
      <p>Aman Baislaa was among the names discussed in online reporting during 2025. In February 2025, media reports covered a public dispute involving Aman Baislaa, Harsh Vikal and YouTuber Lakshay Chaudhary. The reports included allegations made by Lakshay and responses from Aman and Harsh, who denied the claims.</p>
      <p>The episode demonstrates how quickly social media discussions can become public conversations. For creators, maintaining clear communication, understanding the reach of online content and responding carefully to public discussions can become an important part of managing a digital presence.</p>
      <p>Aman Baislaa's digital presence also provides an example of how content creation and personal branding can become important parts of the modern creator ecosystem.</p>
      <p>If you also want to explore content creation, personal branding, digital marketing and other skills required to build your own digital presence, The Smart Worth can help you learn and develop these skills through structured digital learning resources.</p>
      <p>The goal is not to copy someone else's journey. The goal is to understand the skills, learn the process and build your own path in the digital world.</p>
      <p>The Smart Worth can help you take the first step toward turning your ideas into practical digital skills and projects.</p>
    `
  },
  {
    id: '02',
    slug: 'harsh-vikal-digital-entrepreneurship',
    title: 'Harsh Vikal: From Digital Entrepreneurship to Building Education Communities',
    category: 'Entrepreneurship',
    author: 'Harsh Vikal',
    readTime: '6 min read',
    publishedDate: '2025-12-16',
    date: '2025-12-16',
    excerpt:
      'Harsh Vikal has been associated with digital entrepreneurship, education and community-building, reflecting the growing connection between online content and digital learning businesses.',
    image_url: 'https://i.postimg.cc/X3r5KMCW/harsh-vikal.png',
    image: 'https://i.postimg.cc/X3r5KMCW/harsh-vikal.png',
    imageFileName: 'harsh-vikal.jpg',
    status: 'published',
    content: `
      <p>Harsh Vikal has been profiled as a digital entrepreneur and education-focused business operator. A December 2025 profile described his journey from learning digital systems independently to building Knowledge Wave India and expanding his business activities.</p>
      <p>His public profile combines digital education, entrepreneurship and community-building. Knowledge Wave India has been presented as an initiative focused on practical learning and execution rather than purely theoretical education.</p>
      <p>The broader lesson for aspiring creators is that digital influence can extend beyond short-form content. Educational platforms, communities and structured learning products can become additional parts of a creator's ecosystem.</p>
      <p>This kind of journey shows how digital knowledge, education and entrepreneurship can come together to create new opportunities.</p>
      <p>If you want to develop skills in digital entrepreneurship, online business, technology and practical learning, The Smart Worth can help you explore these areas through structured learning resources.</p>
      <p>You do not need to copy someone else's path. The important thing is to learn the skills, apply them to your own ideas and keep improving.</p>
      <p>The Smart Worth can be your learning companion as you work toward building your own digital journey.</p>
    `
  },
  {
    id: '03',
    slug: 'ankur-warikoo-digital-creator-brand',
    title: 'Ankur Warikoo and the Business of Building a Digital Creator Brand',
    category: 'Entrepreneurship',
    author: 'Ankur Warikoo',
    readTime: '5 min read',
    publishedDate: '2025-01-18',
    date: '2025-01-18',
    excerpt:
      'Ankur Warikoo has built a digital creator brand around entrepreneurship, education, personal finance and online content.',
    image_url: 'https://i.postimg.cc/wgh7F9Tv/ankur-warikoo.png',
    image: 'https://i.postimg.cc/wgh7F9Tv/ankur-warikoo.png',
    imageFileName: 'ankur-warikoo.jpg',
    status: 'published',
    content: `
      <p>Ankur Warikoo has built a career around entrepreneurship, education, personal finance and digital content. His official website describes him as an internet entrepreneur, content creator, bestselling author and educator.</p>
      <p>In January 2025, Warikoo publicly discussed the revenue structure of his business and clarified that the figures represented business revenue rather than personal salary. Reports described multiple revenue streams connected with his content and education businesses.</p>
      <p>His creator journey shows how a personal brand can develop into multiple business verticals. Content can create an audience, while books, education products, communities and other ventures can create additional ways to serve that audience.</p>
      <p>This is an important lesson for anyone interested in building a digital career. Content creation, communication, branding, entrepreneurship and technology can work together as part of one digital ecosystem.</p>
      <p>If you want to learn the skills behind content creation, personal branding, entrepreneurship and digital business, The Smart Worth can help you build a stronger foundation through practical learning resources.</p>
      <p>The aim is not to promise the same results as anyone else. The aim is to help you develop the knowledge and skills needed to work on your own ideas.</p>
      <p>Start learning with The Smart Worth and begin building your own digital journey.</p>
    `
  },
  {
    id: '04',
    slug: 'raj-shamani-business-podcasts',
    title: 'Raj Shamani and the Rise of Business Podcasts in India',
    category: 'Content Creation',
    author: 'Raj Shamani',
    readTime: '5 min read',
    publishedDate: '2025-06-10',
    date: '2025-06-10',
    excerpt:
      "Raj Shamani represents the growing role of business podcasts and long-form digital conversations in India's creator economy.",
    image_url: 'https://i.postimg.cc/hvDw1gcG/raj-shamani.png',
    image: 'https://i.postimg.cc/hvDw1gcG/raj-shamani.png',
    imageFileName: 'raj-shamani.jpg',
    status: 'published',
    content: `
      <p>Raj Shamani has become known for combining entrepreneurship, business conversations and digital media. His podcast, Figuring Out with Raj Shamani, focuses on entrepreneurship, personal development and conversations with notable guests.</p>
      <p>His creator journey represents a broader shift in Indian digital media. Podcasts allow creators to move beyond short-form entertainment and build long-form conversations around business, careers, personal development and current topics.</p>
      <p>For aspiring creators, the format offers an interesting lesson: a strong content identity does not necessarily depend on one type of video. Interviews, educational discussions, clips and social media posts can work together as one content ecosystem.</p>
      <p>This shows how communication, content creation and personal branding can become valuable digital skills.</p>
      <p>If you want to learn content creation, communication, personal branding and digital media skills, The Smart Worth can help you explore these areas through structured learning.</p>
      <p>Your journey will be different from anyone else's. What matters is developing useful skills and applying them consistently.</p>
      <p>The Smart Worth can help you take those first steps toward building your own digital presence.</p>
    `
  },
  {
    id: '05',
    slug: 'ranveer-allahbadia-digital-audience',
    title: 'Ranveer Allahbadia and the Responsibility of Large Digital Audiences',
    category: 'Content Creation',
    author: 'Ranveer Allahbadia',
    readTime: '5 min read',
    publishedDate: '2025-02-12',
    date: '2025-02-12',
    excerpt:
      'The 2025 controversy surrounding Ranveer Allahbadia highlighted how quickly statements made by major digital creators can reach large audiences.',
    image_url: 'https://i.postimg.cc/YpmcfCMW/ranveer-allahbadia.png',
    image: 'https://i.postimg.cc/YpmcfCMW/ranveer-allahbadia.png',
    imageFileName: 'ranveer-allahbadia.jpg',
    status: 'published',
    content: `
      <p>Ranveer Allahbadia, also known as BeerBiceps, is an Indian YouTuber, podcaster and entrepreneur known for long-form conversations covering subjects such as business, finance, personal development and spirituality.</p>
      <p>In February 2025, a public controversy surrounding comments made during an online comedy programme received significant media attention. Allahbadia subsequently issued a public apology.</p>
      <p>The episode became an example of the responsibility that comes with large online audiences. A creator's words can travel far beyond the original programme through clips, reposts and news coverage.</p>
      <p>For digital creators, the situation reinforces the importance of understanding context, audience expectations and the potential reach of every public appearance.</p>
      <p>This also shows why content creation is more than simply recording and uploading videos. Communication, audience understanding, digital branding and responsible publishing are important skills.</p>
      <p>If you want to develop content creation, communication, branding and digital media skills, The Smart Worth can help you learn the fundamentals and practise them through structured resources.</p>
      <p>The goal is to build your own responsible digital presence using the skills you develop.</p>
    `
  },
  {
    id: '06',
    slug: 'sharan-hegde-finance-creators',
    title: 'Sharan Hegde and the Changing Role of Finance Creators',
    category: 'Finance',
    author: 'Sharan Hegde',
    readTime: '6 min read',
    publishedDate: '2025-02-04',
    date: '2025-02-04',
    excerpt:
      "Sharan Hegde's creator journey reflects the growing role of financial education creators and the importance of understanding the difference between education and regulated financial advice.",
    image_url: 'https://i.postimg.cc/B4Zd7gJP/sharan-hegde.png',
    image: 'https://i.postimg.cc/B4Zd7gJP/sharan-hegde.png',
    imageFileName: 'sharan-hegde.jpg',
    status: 'published',
    content: `
      <p>Sharan Hegde is a finance-focused content creator and entrepreneur behind Finance With Sharan. His official website describes him as a former management consultant who moved into full-time financial content creation.</p>
      <p>February 2025 brought an important development for his business. Moneycontrol reported that his company's Personal CFO division received a SEBI-registered Investment Adviser licence.</p>
      <p>The development came during a period when financial-content creators were facing increased attention around regulations and the distinction between education and regulated financial advice.</p>
      <p>For audiences, this makes one point especially important: financial content should be understood as education unless it is being provided through the appropriate regulated framework.</p>
      <p>Sharan Hegde's journey also demonstrates how financial knowledge, communication and digital content can come together to create an educational online presence.</p>
      <p>If you want to understand finance-related concepts, digital content creation and the skills involved in building an educational online presence, The Smart Worth can help you explore these subjects through structured learning resources.</p>
      <p>Financial education should always be approached responsibly. The purpose of learning is to understand concepts and develop knowledge, not to expect guaranteed financial results.</p>
      <p>The Smart Worth can help you build the knowledge that supports your own learning journey.</p>
    `
  },
  {
    id: '07',
    slug: 'akshat-shrivastava-investment-education',
    title: 'Akshat Shrivastava and the Growing Popularity of Investment Education',
    category: 'Finance',
    author: 'Akshat Shrivastava',
    readTime: '5 min read',
    publishedDate: '2025-03-20',
    date: '2025-03-20',
    excerpt:
      'Akshat Shrivastava has built an online audience around investing, global markets and financial education.',
    image_url: 'https://i.postimg.cc/NB0zkjxQ/akshat-shrivastava.png',
    image: 'https://i.postimg.cc/NB0zkjxQ/akshat-shrivastava.png',
    imageFileName: 'akshat-shrivastava.jpg',
    status: 'published',
    content: `
      <p>Akshat Shrivastava has built a large online audience around investing, global markets and financial education.</p>
      <p>In March 2025, he published a video discussing his plan to invest gradually in a US stock market portfolio and explained the reasoning behind his approach. The video also carried a disclaimer that the content was not investment advice.</p>
      <p>Later in 2025, another video discussed his reported investment activity and the development of a public portfolio that he began building during January 2025.</p>
      <p>His content demonstrates how creators can use publicly documented portfolios and educational explanations to make financial concepts easier for audiences to understand.</p>
      <p>This also shows the importance of research, financial literacy and the ability to understand information before making decisions.</p>
      <p>If you want to improve your understanding of finance, investing concepts, digital content and research-based learning, The Smart Worth can help you develop these skills through structured educational resources.</p>
      <p>Learning from public examples can be useful, but your financial decisions should always be based on your own research and understanding.</p>
      <p>Use The Smart Worth as a place to learn, explore and build your financial knowledge step by step.</p>
    `
  },
  {
    id: '08',
    slug: 'rachana-ranade-financial-education',
    title: 'CA Rachana Ranade: Making Financial Education Easier to Understand',
    category: 'Finance',
    author: 'CA Rachana Ranade',
    readTime: '5 min read',
    publishedDate: '2025-11-22',
    date: '2025-11-22',
    excerpt:
      'CA Rachana Ranade has built a digital education ecosystem around personal finance, investing and financial literacy.',
    image_url: 'https://i.postimg.cc/cxHFMDRW/rachana-ranade.png',
    image: 'https://i.postimg.cc/cxHFMDRW/rachana-ranade.png',
    imageFileName: 'rachana-ranade.jpg',
    status: 'published',
    content: `
      <p>CA Rachana Ranade is a Chartered Accountant and finance educator who has built a large digital education ecosystem around personal finance and investing.</p>
      <p>A November 2025 creator profile described her content as focused on simplifying investing, taxation and personal-finance concepts for a broad audience.</p>
      <p>Her educational approach focuses on taking concepts that can appear complicated to beginners and explaining them in a structured way.</p>
      <p>Her official platform also presents learning paths covering money management, mutual funds and stock-market fundamentals.</p>
      <p>The growth of finance educators such as Ranade reflects the increasing demand for accessible financial literacy content in India's digital-learning environment.</p>
      <p>This educational approach also matches an important part of The Smart Worth's vision: making useful knowledge easier to understand and connecting learning with practical digital skills.</p>
      <p>If you want to improve your financial literacy while also exploring technology, entrepreneurship and digital learning, The Smart Worth can help you build your knowledge through structured resources.</p>
      <p>The purpose is to make learning easier to understand and give you a foundation that you can apply to your own goals.</p>
      <p>Start learning with The Smart Worth and continue building your knowledge one skill at a time.</p>
    `
  },
  {
    id: '09',
    slug: 'nithin-kamath-financial-discipline',
    title: 'Nithin Kamath and the Importance of Financial Discipline',
    category: 'Finance & Business',
    author: 'Nithin Kamath',
    readTime: '5 min read',
    publishedDate: '2026-01-20',
    date: '2026-01-20',
    excerpt:
      'Nithin Kamath has frequently discussed personal finance, investing behaviour and the importance of developing disciplined financial habits.',
    image_url: 'https://i.postimg.cc/jTFcY460/nithin-kamath.png',
    image: 'https://i.postimg.cc/jTFcY460/nithin-kamath.png',
    imageFileName: 'nithin-kamath.jpg',
    status: 'published',
    content: `
      <p>Nithin Kamath, co-founder and CEO of Zerodha, has frequently discussed personal finance, investing behaviour and financial discipline.</p>
      <p>One of the recurring themes in his public discussions is that financial success is not simply about chasing higher returns. His experiences with money have also influenced his views on saving, cash reserves and responsible financial habits.</p>
      <p>For young learners, the broader lesson is useful: understanding income, expenses, savings and risk should come before making complicated financial decisions.</p>
      <p>Financial education is ultimately about understanding how money works and making decisions based on knowledge rather than short-term excitement.</p>
      <p>This is relevant to anyone who wants to build a stronger foundation for their future.</p>
      <p>If you want to build knowledge in financial literacy, digital skills and entrepreneurship, The Smart Worth can help you explore these subjects through structured learning resources.</p>
      <p>The goal is not to follow someone else's financial decisions. The goal is to develop your own understanding and make better-informed choices.</p>
      <p>The Smart Worth can help you take the first step toward building that knowledge.</p>
    `
  },
  {
    id: '10',
    slug: 'vijay-kedia-long-term-investing',
    title: 'Vijay Kedia and the Long-Term Approach to Investing',
    category: 'Investing',
    author: 'Vijay Kedia',
    readTime: '6 min read',
    publishedDate: '2025-12-27',
    date: '2025-12-27',
    excerpt:
      "Vijay Kedia's publicly discussed investment approach provides an opportunity to understand the importance of business quality, risk and long-term thinking.",
    image_url: 'https://i.postimg.cc/XjR9Gxxp/vijay-kedia.png',
    image: 'https://i.postimg.cc/XjR9Gxxp/vijay-kedia.png',
    imageFileName: 'vijay-kedia.jpg',
    status: 'published',
    content: `
      <p>Vijay Kedia is a well-known Indian investor whose publicly disclosed portfolio has attracted considerable attention from market observers.</p>
      <p>An April 2025 profile examined his investment approach and highlighted themes such as business quality, management and long-term potential.</p>
      <p>By December 2025, market reports were also analysing his publicly disclosed holdings and the performance of those holdings during calendar year 2025.</p>
      <p>His investment philosophy is frequently associated with looking beyond short-term market movements and studying the underlying business.</p>
      <p>For learners, the useful takeaway is that investing involves understanding businesses, valuation, risk and time horizon rather than simply following a popular name or stock.</p>
      <p>These concepts also connect with the broader learning ecosystem of The Smart Worth, where learners can explore finance, business, technology, entrepreneurship and other practical digital skills.</p>
      <p>If you want to learn more about finance, business fundamentals, entrepreneurship and digital-age skills, The Smart Worth can help you build your knowledge through structured educational resources.</p>
      <p>Learning is the first step. Understanding concepts, researching independently and developing your own skills are what create a stronger foundation.</p>
      <p>Explore The Smart Worth and start building the knowledge you need for your own journey.</p>
    `
  }
];

export function getRelatedBlogPosts(currentPost: BlogPost, count = 3): BlogPost[] {
  const otherPosts = blogPosts.filter(
    (p) => p.id !== currentPost.id && p.slug !== currentPost.slug
  );

  // 1) Exact same category first
  const sameCategory = otherPosts.filter((p) => p.category === currentPost.category);

  // 2) Similar category group second
  const similarCategoryMap: Record<string, string[]> = {
    'Content Creation': ['Entrepreneurship', 'Finance & Business'],
    Entrepreneurship: ['Content Creation', 'Finance & Business'],
    Finance: ['Investing', 'Finance & Business'],
    Investing: ['Finance', 'Finance & Business'],
    'Finance & Business': ['Finance', 'Investing', 'Entrepreneurship']
  };
  const similarCategories = similarCategoryMap[currentPost.category] || [];
  const similarPosts = otherPosts.filter(
    (p) =>
      p.category !== currentPost.category && similarCategories.includes(p.category)
  );

  // 3) Remaining posts if still needed
  const remainingPosts = otherPosts.filter(
    (p) =>
      p.category !== currentPost.category && !similarCategories.includes(p.category)
  );

  return [...sameCategory, ...similarPosts, ...remainingPosts].slice(0, count);
}

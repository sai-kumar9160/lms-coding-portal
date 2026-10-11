import { useEffect, useState } from 'react';
import Markdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fileUrl, request } from '../api';

// Images inside lesson content are stored as files and referenced as "file:<id>".
const urlTransform = (url) => (url.startsWith('file:') ? fileUrl(url.slice(5)) : defaultUrlTransform(url));

// Renders a lesson's formatted chapter (headings, paragraphs, lists, code, tables, figures) as a web page.
// Markdown is rendered without raw HTML, so content cannot inject scripts.
export function LessonArticle({ lessonId }) {
    const [state, setState] = useState({ loading: true });
    useEffect(() => {
        let cancelled = false;
        setState({ loading: true });
        request(`/lessons/${lessonId}/content`).then(lesson => { if (!cancelled) setState({ lesson }); }).catch(error => { if (!cancelled) setState({ error: error.message }); });
        return () => { cancelled = true; };
    }, [lessonId]);
    if (state.loading)
        return <p className="muted">Loading lesson…</p>;
    if (state.error)
        return <div role="alert" className="alert">{state.error}</div>;
    const { lesson } = state;
    if (lesson.contentFormat !== 'MARKDOWN')
        return lesson.content ? <div className="lesson-content">{lesson.content}</div> : null;
    return <article className="lesson-article">
        <Markdown remarkPlugins={[remarkGfm]} urlTransform={urlTransform} components={{
            img: ({ src, alt }) => <img src={src} alt={alt || ''} loading="lazy"/>,
            table: ({ children }) => <div className="article-table"><table>{children}</table></div>,
            a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>,
        }}>{lesson.content}</Markdown>
    </article>;
}

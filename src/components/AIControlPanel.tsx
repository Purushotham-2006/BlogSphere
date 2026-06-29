import React, { useState } from "react";
import { Sparkles, FileText, Heading, Tag, CheckSquare, BarChart, Search, Play, Check, AlertCircle, RefreshCw } from "lucide-react";

interface AIControlPanelProps {
  title: string;
  content: string;
  tags: string[];
  token: string;
  onApplyTitle: (title: string) => void;
  onApplyTags: (tags: string[]) => void;
  onApplyContent: (content: string) => void;
}

export default function AIControlPanel({
  title,
  content,
  tags,
  token,
  onApplyTitle,
  onApplyTags,
  onApplyContent,
}: AIControlPanelProps) {
  // Loading states
  const [loadingType, setLoadingType] = useState<string | null>(null);

  // Results states
  const [summary, setSummary] = useState<string | null>(null);
  const [titles, setTitles] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [correctedText, setCorrectedText] = useState<string | null>(null);
  const [readingLevel, setReadingLevel] = useState<{ level: string; score: number; explanation: string } | null>(null);
  const [seoScore, setSeoScore] = useState<{ score: number; tips: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiPost = async (url: string, body: any) => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Request failed");
    }
    return data;
  };

  const handleSummarize = async () => {
    if (!content.trim()) return setError("Write some draft content first to summarize");
    setError(null);
    setLoadingType("summary");
    try {
      const data = await apiPost("/api/ai/summarize", { content });
      setSummary(data.summary);
    } catch (err: any) {
      setError(err.message || "Failed to generate AI Summary");
    } finally {
      setLoadingType(null);
    }
  };

  const handleGenerateTitles = async () => {
    if (!content.trim()) return setError("Write some draft content to generate title options");
    setError(null);
    setLoadingType("titles");
    try {
      const data = await apiPost("/api/ai/titles", { content });
      setTitles(data.titles);
    } catch (err: any) {
      setError(err.message || "Failed to generate AI Titles");
    } finally {
      setLoadingType(null);
    }
  };

  const handleGenerateTags = async () => {
    if (!content.trim()) return setError("Write some content to suggest appropriate tags");
    setError(null);
    setLoadingType("tags");
    try {
      const data = await apiPost("/api/ai/tags", { content });
      setSuggestedTags(data.tags);
    } catch (err: any) {
      setError(err.message || "Failed to generate AI Tags");
    } finally {
      setLoadingType(null);
    }
  };

  const handleCorrectGrammar = async () => {
    if (!content.trim()) return setError("Please write some content to proofread first");
    setError(null);
    setLoadingType("grammar");
    try {
      const data = await apiPost("/api/ai/grammar", { content });
      setCorrectedText(data.corrected);
    } catch (err: any) {
      setError(err.message || "Failed to run grammar correction");
    } finally {
      setLoadingType(null);
    }
  };

  const handleReadingLevel = async () => {
    if (!content.trim()) return setError("Write some content to analyze readability score");
    setError(null);
    setLoadingType("readingLevel");
    try {
      const data = await apiPost("/api/ai/reading-level", { content });
      setReadingLevel(data);
    } catch (err: any) {
      setError(err.message || "Failed to evaluate reading level");
    } finally {
      setLoadingType(null);
    }
  };

  const handleSeoScore = async () => {
    if (!title.trim() || !content.trim()) return setError("Provide both title and content to perform SEO audit");
    setError(null);
    setLoadingType("seo");
    try {
      const data = await apiPost("/api/ai/seo", { title, content, tags });
      setSeoScore(data);
    } catch (err: any) {
      setError(err.message || "Failed to score content SEO status");
    } finally {
      setLoadingType(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20";
    if (score >= 50) return "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20";
  };

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 p-5 space-y-6 shadow-sm">
      <div className="flex items-center space-x-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">AI Studio Assistant</h3>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500">Premium writer optimization tools</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start space-x-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Buttons Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          onClick={handleSummarize}
          disabled={loadingType !== null}
          className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-neutral-700 dark:text-neutral-300 disabled:opacity-40"
        >
          <FileText className="w-3.5 h-3.5 text-blue-500" />
          <span>{loadingType === "summary" ? "Summarizing..." : "AI Summary"}</span>
        </button>

        <button
          onClick={handleGenerateTitles}
          disabled={loadingType !== null}
          className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-neutral-700 dark:text-neutral-300 disabled:opacity-40"
        >
          <Heading className="w-3.5 h-3.5 text-indigo-500" />
          <span>{loadingType === "titles" ? "Thinking..." : "AI Title Ideas"}</span>
        </button>

        <button
          onClick={handleGenerateTags}
          disabled={loadingType !== null}
          className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-neutral-700 dark:text-neutral-300 disabled:opacity-40"
        >
          <Tag className="w-3.5 h-3.5 text-green-500" />
          <span>{loadingType === "tags" ? "Extracting..." : "Auto-Tags"}</span>
        </button>

        <button
          onClick={handleCorrectGrammar}
          disabled={loadingType !== null}
          className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-neutral-700 dark:text-neutral-300 disabled:opacity-40"
        >
          <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
          <span>{loadingType === "grammar" ? "Proofing..." : "Fix Grammar"}</span>
        </button>

        <button
          onClick={handleReadingLevel}
          disabled={loadingType !== null}
          className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-neutral-700 dark:text-neutral-300 disabled:opacity-40"
        >
          <BarChart className="w-3.5 h-3.5 text-orange-500" />
          <span>{loadingType === "readingLevel" ? "Analyzing..." : "Reading Level"}</span>
        </button>

        <button
          onClick={handleSeoScore}
          disabled={loadingType !== null}
          className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-neutral-700 dark:text-neutral-300 disabled:opacity-40"
        >
          <Search className="w-3.5 h-3.5 text-teal-500" />
          <span>{loadingType === "seo" ? "Auditing..." : "SEO Audit"}</span>
        </button>
      </div>

      {/* Dynamic Results Viewer */}
      <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs">
        
        {/* SUMMARY RESULT */}
        {summary && (
          <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl space-y-2 relative border border-neutral-150 dark:border-neutral-800">
            <h4 className="font-bold text-neutral-900 dark:text-white">AI Post Summary (100 words)</h4>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">{summary}</p>
          </div>
        )}

        {/* TITLES GENERATOR RESULT */}
        {titles.length > 0 && (
          <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl space-y-3 border border-neutral-150 dark:border-neutral-800">
            <h4 className="font-bold text-neutral-900 dark:text-white">Compelling AI Title Ideas</h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {titles.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-neutral-950 rounded-lg border border-neutral-200/50 dark:border-neutral-800/60 gap-3 group">
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium leading-snug">{t}</span>
                  <button
                    onClick={() => onApplyTitle(t)}
                    className="p-1 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 transition-all shrink-0 cursor-pointer"
                    title="Apply Title"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAG SUGGESTIONS RESULT */}
        {suggestedTags.length > 0 && (
          <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl space-y-3 border border-neutral-150 dark:border-neutral-800">
            <h4 className="font-bold text-neutral-900 dark:text-white">Suggested Category Tags</h4>
            <div className="flex flex-wrap gap-1.5">
              {suggestedTags.map((t, idx) => (
                <span key={idx} className="bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/60 px-2 py-1 rounded-lg text-neutral-700 dark:text-neutral-300 font-semibold select-none">
                  #{t}
                </span>
              ))}
            </div>
            <button
              onClick={() => onApplyTags(suggestedTags)}
              className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-center flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply All Suggested Tags</span>
            </button>
          </div>
        )}

        {/* GRAMMAR CORRECTOR RESULT */}
        {correctedText && (
          <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl space-y-3 border border-neutral-150 dark:border-neutral-800">
            <h4 className="font-bold text-neutral-900 dark:text-white">Proofread & Grammar Correction</h4>
            <div className="p-3 bg-white dark:bg-neutral-950 rounded-lg max-h-40 overflow-y-auto font-mono text-[11px] text-neutral-600 dark:text-neutral-400 border border-neutral-200/50 dark:border-neutral-800/60 leading-relaxed whitespace-pre-wrap">
              {correctedText}
            </div>
            <button
              onClick={() => onApplyContent(correctedText)}
              className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-center flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Corrected Spelling & Text</span>
            </button>
          </div>
        )}

        {/* READING LEVEL RESULT */}
        {readingLevel && (
          <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl space-y-2 border border-neutral-150 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-neutral-900 dark:text-white">Readability Evaluation</h4>
              <span className="font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                {readingLevel.level} (Score {readingLevel.score}/100)
              </span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{readingLevel.explanation}</p>
          </div>
        )}

        {/* SEO AUDIT RESULT */}
        {seoScore && (
          <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl space-y-3 border border-neutral-150 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-neutral-900 dark:text-white">SEO Score & Feedback</h4>
              <span className={`font-extrabold border px-2 py-0.5 rounded ${getScoreColor(seoScore.score)}`}>
                {seoScore.score} / 100
              </span>
            </div>
            <div className="space-y-1.5">
              {seoScore.tips.map((tip, idx) => (
                <div key={idx} className="flex items-start space-x-1.5">
                  <span className="text-blue-500 shrink-0 select-none">•</span>
                  <span className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

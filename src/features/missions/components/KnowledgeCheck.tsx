'use client';

import React, { useState, useEffect } from 'react';

export interface QuizOption {
  id: string;
  text: string;
  explanation?: string;
}

export interface QuizDefinition {
  id: string;
  question: string;
  options: QuizOption[];
  correctOptionId: string;
}

export interface KnowledgeCheckProps {
  quiz?: QuizDefinition;
  question?: string;
  options?: QuizOption[];
  correctOptionId?: string;
  selectedOptionId: string | null;
  onSelectOption: (id: string) => void;
  onPass: () => void;
  title?: string;
}

export const KnowledgeCheck: React.FC<KnowledgeCheckProps> = ({
  quiz,
  question: propQuestion,
  options: propOptions,
  correctOptionId: propCorrectOptionId,
  selectedOptionId,
  onSelectOption,
  onPass,
  title = 'Comprobación de Conocimiento',
}) => {
  const question = quiz?.question ?? propQuestion ?? '';
  const options: QuizOption[] = quiz?.options ?? propOptions ?? [];
  const correctOptionId = quiz?.correctOptionId ?? propCorrectOptionId ?? '';

  const [submitted, setSubmitted] = useState<boolean>(false);
  const [passedCalled, setPassedCalled] = useState<boolean>(false);

  const isCorrect = selectedOptionId === correctOptionId;

  useEffect(() => {
    setSubmitted(false);
    setPassedCalled(false);
  }, [selectedOptionId, correctOptionId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOptionId) return;
    setSubmitted(true);

    if (selectedOptionId === correctOptionId) {
      if (!passedCalled) {
        setPassedCalled(true);
        onPass();
      }
    }
  };

  const handleRetry = () => {
    setSubmitted(false);
    setPassedCalled(false);
  };

  return (
    <section
      aria-labelledby="quiz-heading"
      className="bg-background/90 border border-border rounded-xl p-6 shadow-xl flex flex-col gap-4 text-foreground"
    >
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <span className="text-xl" aria-hidden="true">🧠</span>
        <h2 id="quiz-heading" className="text-lg font-bold text-accent">
          {title}
        </h2>
      </div>

      <p className="text-base font-medium text-foreground">{question}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
        <div role="radiogroup" aria-label={question} className="flex flex-col gap-2">
          {options.map((opt: QuizOption) => {
            const isSelected = selectedOptionId === opt.id;
            return (
              <label
                key={opt.id}
                className={`flex items-start gap-3 p-3.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/40 ring-1 ring-cyan-400'
                    : 'border-border bg-background/50 hover:border-border hover:bg-card/50'
                } ${submitted ? 'cursor-default' : ''}`}
              >
                <input
                  type="radio"
                  name="quiz-option"
                  value={opt.id}
                  checked={isSelected}
                  disabled={submitted}
                  onChange={() => !submitted && onSelectOption(opt.id)}
                  className="mt-1 text-accent focus:ring-cyan-400 focus:ring-offset-slate-900"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{opt.text}</span>
                  {submitted && isSelected && opt.explanation && (
                    <span className="text-xs text-muted-foreground mt-1 italic">{opt.explanation}</span>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        <div aria-live="polite" className="mt-2">
          {submitted && (
            <div
              className={`p-4 rounded-lg border text-sm flex flex-col gap-2 ${
                isCorrect
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                <span>{isCorrect ? '✅ ¡Correcto!' : '❌ Respuesta Incorrecta'}</span>
              </div>
              <p>
                {isCorrect
                  ? '¡Has demostrado comprender el concepto clave! Puedes continuar o revisar la misión.'
                  : 'Revisa las explicaciones de la misión y vuelve a intentarlo.'}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-2">
          {!submitted ? (
            <button
              type="submit"
              disabled={!selectedOptionId}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                !selectedOptionId
                  ? 'opacity-40 cursor-not-allowed bg-card text-muted-foreground border border-border'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer shadow-lg shadow-cyan-500/20'
              }`}
            >
              Validar Respuesta
            </button>
          ) : (
            !isCorrect && (
              <button
                type="button"
                onClick={handleRetry}
                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-card hover:bg-muted text-foreground border border-border cursor-pointer transition-all"
              >
                🔄 Reintentar
              </button>
            )
          )}
        </div>
      </form>
    </section>
  );
};

export default KnowledgeCheck;
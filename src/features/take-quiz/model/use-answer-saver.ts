'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import {
  answerOf,
  quizMutations,
  type AttemptAnswer,
  type AttemptQuestion,
} from '@/entities/quiz';
import { toApiError } from '@/shared/api';

export type SaveState = 'saving' | 'saved' | 'error';

export interface AttemptPath {
  institutionId: string;
  spaceId: string;
  quizId: string;
  attemptId: string;
}

interface SaverOptions {
  path: AttemptPath;
  questions: readonly AttemptQuestion[];
  onSaved: (remainingSeconds: number | null) => void;
  onClosed: () => void;
}

const TYPING_PAUSE_MS = 800;

export function useAnswerSaver(options: SaverOptions) {
  const [answers, setAnswers] = useState<Record<number, AttemptAnswer | null>>(() =>
    Object.fromEntries(
      options.questions.map(question => [question.position, answerOf(question.response)]),
    ),
  );
  const { mutateAsync: send } = useMutation(quizMutations.saveAnswer());
  const [states, setStates] = useState<Record<number, SaveState>>({});
  const config = useRef(options);
  const latest = useRef(answers);
  const dirty = useRef(new Set<number>());
  const timers = useRef(new Map<number, number>());
  const queue = useRef(new Map<number, Promise<void>>());

  useEffect(() => {
    config.current = options;
  });

  useEffect(() => {
    const pending = timers.current;

    return () => {
      for (const timer of pending.values()) window.clearTimeout(timer);
    };
  }, []);

  const mark = (position: number, state: SaveState) => {
    setStates(current => ({ ...current, [position]: state }));
  };

  const sendOne = async (position: number) => {
    if (!dirty.current.has(position)) return;

    dirty.current.delete(position);
    mark(position, 'saving');
    try {
      const saved = await send({
        path: { ...config.current.path, position },
        body: latest.current[position] ?? {},
      });
      if (!dirty.current.has(position)) mark(position, 'saved');
      config.current.onSaved(saved.remainingSeconds);
    } catch (error) {
      if (toApiError(error).code === 'QUIZ_ATTEMPT_CLOSED') {
        config.current.onClosed();
        return;
      }
      dirty.current.add(position);
      mark(position, 'error');
    }
  };

  const save = (position: number): Promise<void> => {
    const next = (queue.current.get(position) ?? Promise.resolve()).then(() =>
      sendOne(position),
    );
    queue.current.set(position, next);

    return next;
  };

  const change = (position: number, answer: AttemptAnswer, typing = false) => {
    latest.current = { ...latest.current, [position]: answer };
    setAnswers(latest.current);
    dirty.current.add(position);
    window.clearTimeout(timers.current.get(position));
    timers.current.set(
      position,
      window.setTimeout(() => void save(position), typing ? TYPING_PAUSE_MS : 0),
    );
  };

  const flush = async () => {
    for (const timer of timers.current.values()) window.clearTimeout(timer);
    timers.current.clear();
    await Promise.all([...dirty.current].map(save));
    await Promise.all(queue.current.values());
  };

  return { answers, states, change, flush, retry: save };
}

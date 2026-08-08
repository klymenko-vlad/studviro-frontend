import { beforeEach, describe, expect, it, vi } from 'vitest';

import { addLogSink, logger, type LogRecord } from './logger';

function captureSink() {
  const records: LogRecord[] = [];
  const remove = addLogSink(record => {
    records.push(record);
  });
  return { records, remove };
}

describe('logger', () => {
  beforeEach(() => {
    // The console sink is always registered; silence it so test output stays readable.
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'debug').mockImplementation(() => undefined);
  });

  it('forwards a record to every registered sink', () => {
    const first = captureSink();
    const second = captureSink();

    logger.info('user created', { userId: 'u_1' });

    for (const sink of [first, second]) {
      expect(sink.records).toHaveLength(1);
      expect(sink.records[0]).toMatchObject({
        level: 'info',
        message: 'user created',
        context: { userId: 'u_1' },
      });
    }

    first.remove();
    second.remove();
  });

  it('stops delivering after the sink is removed', () => {
    const { records, remove } = captureSink();

    remove();
    logger.info('ignored');

    expect(records).toHaveLength(0);
  });

  it('lifts an Error out of the context so sinks receive a real stack', () => {
    const { records, remove } = captureSink();
    const cause = new Error('boom');

    logger.error('request failed', { error: cause, route: '/users' });

    expect(records[0]?.error).toBe(cause);
    // It must not also remain in the context bag, or sinks double-report it.
    expect(records[0]?.context).toEqual({ route: '/users' });

    remove();
  });

  it('ignores a non-Error value in the error slot rather than faking one', () => {
    const { records, remove } = captureSink();

    logger.error('odd failure', { error: 'just a string' });

    expect(records[0]?.error).toBeUndefined();

    remove();
  });

  /**
   * A logging call must never be the reason a request fails — this is the whole
   * justification for the try/catch around sink dispatch.
   */
  it('survives a sink that throws and still reaches the others', () => {
    const remove = addLogSink(() => {
      throw new Error('sink is broken');
    });
    const { records, remove: removeCapture } = captureSink();

    expect(() => {
      logger.warn('still delivered');
    }).not.toThrow();
    expect(records).toHaveLength(1);

    remove();
    removeCapture();
  });
});

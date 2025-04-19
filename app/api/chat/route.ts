import { NextResponse } from 'next/server';
import { chat } from '@/lib/llm';

export async function POST(request: Request) {
  try {
    const { messages, context } = await request.json();

    const response = await chat(messages, context);

    return NextResponse.json({ content: response });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 
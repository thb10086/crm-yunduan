import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// 生成简单的数学验证码
function generateMathCaptcha() {
  const num1 = Math.floor(Math.random() * 10)
  const num2 = Math.floor(Math.random() * 10)
  const operators = ['+', '-']
  const operator = operators[Math.floor(Math.random() * operators.length)]
  
  let answer: number
  if (operator === '+') {
    answer = num1 + num2
  } else {
    answer = num1 - num2
  }
  
  const text = `${num1} ${operator} ${num2} = ?`
  
  // 生成SVG
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="40">
      <rect width="120" height="40" fill="#f0f0f0"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#333">
        ${text}
      </text>
      <line x1="${10 + Math.random() * 20}" y1="${Math.random() * 40}" 
            x2="${80 + Math.random() * 30}" y2="${Math.random() * 40}" 
            stroke="#aaa" stroke-width="1"/>
    </svg>
  `
  
  return { svg, answer: answer.toString() }
}

export async function GET() {
  const { svg, answer } = generateMathCaptcha()

  // 存储验证码到cookie
  const cookieStore = await cookies()
  cookieStore.set('captcha', answer, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 300, // 5分钟有效
  })

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}

export async function POST(request: Request) {
  const { code } = await request.json()
  const cookieStore = await cookies()
  const storedCaptcha = cookieStore.get('captcha')?.value

  if (!storedCaptcha || !code) {
    return NextResponse.json({ valid: false, message: '验证码已过期' })
  }

  const isValid = code.toLowerCase() === storedCaptcha
  
  // 验证后清除验证码
  if (isValid) {
    cookieStore.delete('captcha')
  }

  return NextResponse.json({ valid: isValid })
}

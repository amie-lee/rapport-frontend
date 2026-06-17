import { SignupCompleteView } from './SignupCompletePage'

export default function CounselorSignupCompletePage() {
  return (
    <SignupCompleteView
      message={'회원가입이 완료됐어요!\n심사를 위해 자격 정보를 입력해주세요'}
      nextPath="/counselor-credential"
    />
  )
}

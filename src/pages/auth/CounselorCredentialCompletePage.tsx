import { SignupCompleteView } from './SignupCompletePage'

export default function CounselorCredentialCompletePage() {
  return (
    <SignupCompleteView
      message="심사가 완료되면 알려드릴게요"
      nextPath="/counselor-pending"
      buttonLabel="확인"
    />
  )
}

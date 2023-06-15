import { ReactNode, useEffect } from 'react'
import BlankLayout from 'src/@core/layouts/BlankLayout'
import { useRouter } from 'next/router'
import axios from 'axios'
import socmedApi from 'src/configs/socmedApi'

const CallbackFBPage = () => {

  const router = useRouter()

  useEffect(() => {
    const sendCallbackFB = async () => {
      try {
        const code = new URLSearchParams(window.location.search).get('code');

        // Mengirim code ke API Node.js melalui route '/callback-facebook'
        await axios.get(socmedApi.callbackFB + '?code=' + code);

        window.close;

        //after successfully
        // router.push('/link-social');
      } catch (error) {
        console.error('Error:', error)
      }
    }

    sendCallbackFB()
  }, [router])

  return (
    <>
      <h1>Success Linked Facebook</h1>
    </>
  )
}

CallbackFBPage.getLayout = (page: ReactNode) => <BlankLayout>{page}</BlankLayout>
CallbackFBPage.guestGuard = true

export default CallbackFBPage
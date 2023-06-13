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
        // Mengambil access token dari LocalStorage
        // const accessToken = window.localStorage.getItem('accessToken')

        // await axios.get(socmedApi.callbackFB + code, {
        //   headers: {
        //     Authorization: `Bearer ${accessToken}`
        //   }
        // })

        //code ini dari facebook ingin di lempar ke callback API agar dapat memproses fb strategy
        const code = new URLSearchParams(window.location.search).get('code');

        await axios.get(socmedApi.callbackFB + '?code=' + code);

        // await window.localStorage.getItem('accessToken')
        window.close;

        //after successfully
        router.push('/link-social');
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
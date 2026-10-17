'use client'

import { useParams } from 'next/navigation'
import FormProcesso from '../../../components/FormProcesso'

export default function EditarProcesso() {
  const { id } = useParams()
  return <FormProcesso id={id} />
}

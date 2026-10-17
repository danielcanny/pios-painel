'use client'

import { useParams } from 'next/navigation'
import FormTitular from '../../components/FormTitular'

export default function EditarTitular() {
  const { id } = useParams()
  return <FormTitular id={id} />
}

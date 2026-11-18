import { X } from 'lucide-react'

export default function Modal({ title, eyebrow, onClose, children, wide = false }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}><button className="icon-button modal-close" onClick={onClose} aria-label="Close"><X size={19}/></button>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h2>{title}</h2>{children}</section></div>
}

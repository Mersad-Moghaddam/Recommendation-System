import { Star } from '@phosphor-icons/react'
import { Dialog, SpinnerLabel } from './UI'
import { COPY } from '../constants/copy'
import { faNumber } from '../utils'

export default function RatingDialog({ movie, rating, busy, onRatingChange, onSave, onClose }) {
  if (!movie) return null
  return (
    <Dialog title={COPY.ratingDialog.title} onClose={() => { if (!busy) onClose() }}>
      <div className="rating-dialog">
        <p>{COPY.ratingDialog.prompt(movie.display_title || movie.title)}</p>
        <div className="rating-picker">
          {[1, 2, 3, 4, 5].map((value) => (
            <button type="button" key={value} disabled={busy} aria-pressed={rating === value} className={rating === value ? 'selected' : ''} onClick={() => onRatingChange(value)} aria-label={COPY.ratingDialog.aria(value)}>
              <Star weight={value <= rating ? 'fill' : 'duotone'} aria-hidden="true" /><span>{faNumber(value)}</span>
            </button>
          ))}
        </div>
        <button type="button" className="button primary large" disabled={busy} onClick={onSave}>
          {busy ? <SpinnerLabel>{COPY.ratingDialog.saving}</SpinnerLabel> : COPY.ratingDialog.save}
        </button>
      </div>
    </Dialog>
  )
}

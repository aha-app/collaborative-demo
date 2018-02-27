class Operation < ApplicationRecord
  belongs_to :document

  serialize :data, JSON

  validates :document_id, presence: true
  validates :kind, presence: true
  validates :data, presence: true
  validates :version, presence: true, uniqueness: {scope: :document_id}
end

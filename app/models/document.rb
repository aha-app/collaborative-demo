class Document < ApplicationRecord
  has_many :operations

  def generate_insert(text, offset)
    Operation.new(
      kind: :insert,
      version: version,
      data: {text: text, offset: offset}
    )
  end

  def generate_remove(text, offset)
    Operation.new(
      kind: :remove,
      version: version,
      data: {text: text, offset: offset}
    )
  end

  def apply(operation)
    case operation.kind
    when "insert"
      self.content.insert(operation.data["offset"], operation.data["text"])
    when "remove"
      self.content.slice!(operation.data["offset"], operation.data["text"].length)
    end
    self.version = operation.version + 1
    self
  end

  private


end

require 'test_helper'

class DocumentTest < ActiveSupport::TestCase
  test "apply an insert operation on an empty document" do
    doc = Document.new
    op = doc.generate_insert("a", 0)
    assert_equal "a", doc.apply(op).content
  end

  test "apply an insert operation at the beginning of a document" do
    doc = Document.new(content: "hello")
    op = doc.generate_insert("a", 0)
    assert_equal "ahello", doc.apply(op).content
  end

  test "apply an insert operation in the middle of a document" do
    doc = Document.new(content: "car")
    op = doc.generate_insert("h", 1)
    assert_equal "char", doc.apply(op).content
  end

  test "apply an insert operation at the end of a document" do
    doc = Document.new(content: "car")
    op = doc.generate_insert("t", 3)
    assert_equal "cart", doc.apply(op).content
  end

  test "apply an empty insert operation at the end of a document" do
    doc = Document.new(content: "car")
    op = doc.generate_insert("", 3)
    assert_equal "car", doc.apply(op).content
  end

  test "apply a remove operation on an empty document" do
    doc = Document.new
    op = doc.generate_remove("", 0)
    assert_equal "", doc.apply(op).content
  end

  test "apply a remove operation at the beginning of a document" do
    doc = Document.new(content: "ahello")
    op = doc.generate_remove("a", 0)
    assert_equal "hello", doc.apply(op).content
  end

  test "apply a remove operation in the middle of a document" do
    doc = Document.new(content: "char")
    op = doc.generate_remove("h", 1)
    assert_equal "car", doc.apply(op).content
  end

  test "apply a remove operation at the end of a document" do
    doc = Document.new(content: "cart")
    op = doc.generate_remove("t", 3)
    assert_equal "car", doc.apply(op).content
  end

  test "apply an empty remove operation at the end of a document" do
    doc = Document.new(content: "car")
    op = doc.generate_remove("", 3)
    assert_equal "car", doc.apply(op).content
  end

  test "applying an operation changes the document's version number" do
    doc = Document.new(content: "cart", version: 4)
    op = doc.generate_remove("t", 3)
    assert_equal 5, doc.apply(op).version
  end
end

class CreateDocuments < ActiveRecord::Migration[5.1]
  def change
    create_table :documents do |t|
      t.text :content, null: false, default: ""
      t.integer :version, null: false, default: 0

      t.timestamps
    end
  end
end

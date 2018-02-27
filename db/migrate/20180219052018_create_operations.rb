class CreateOperations < ActiveRecord::Migration[5.1]
  def change
    create_table :operations do |t|
      t.references :document, foreign_key: true, null: false
      t.string :kind, null: false
      t.string :data, null: false
      t.integer :version, null: false

      t.timestamps
    end
    add_index :operations, [:document_id, :version], unique: true
  end
end

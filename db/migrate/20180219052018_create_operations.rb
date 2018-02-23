class CreateOperations < ActiveRecord::Migration[5.1]
  def change
    create_table :operations do |t|
      t.references :document, foreign_key: true
      t.string :type, null: false
      t.string :data, null: false
      t.integer :version, null: false, unique: true

      t.timestamps
    end
    add_index :operations, :version
  end
end

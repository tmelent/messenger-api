import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1743630451553 implements MigrationInterface {
    name = 'Initial1743630451553'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chat" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_private" boolean NOT NULL, "created_by_id" uuid NOT NULL, CONSTRAINT "PK_9d0b2ba74336710fd31154738a5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text NOT NULL, "username" text NOT NULL, "password" text NOT NULL, "blocked" boolean NOT NULL DEFAULT 'false', "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "UQ_user_username" UNIQUE ("username"), CONSTRAINT "UQ_user_email" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "encrypted_text" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "sender_id" uuid NOT NULL, "chat_id" uuid NOT NULL, CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "chat_users" ("chat_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_31efa25a44c55b3ceed47f98ba4" PRIMARY KEY ("chat_id", "user_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f60265ed6da63600bad2c5ee8c" ON "chat_users" ("chat_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_9a5f2493e2c02490ceb527649e" ON "chat_users" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "chat" ADD CONSTRAINT "chat_created_by_fk" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_c0ab99d9dfc61172871277b52f6" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_859ffc7f95098efb4d84d50c632" FOREIGN KEY ("chat_id") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "chat_users" ADD CONSTRAINT "chat_users_chat_fk" FOREIGN KEY ("chat_id") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "chat_users" ADD CONSTRAINT "chat_users_user_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_users" DROP CONSTRAINT "chat_users_user_fk"`);
        await queryRunner.query(`ALTER TABLE "chat_users" DROP CONSTRAINT "chat_users_chat_fk"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_859ffc7f95098efb4d84d50c632"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_c0ab99d9dfc61172871277b52f6"`);
        await queryRunner.query(`ALTER TABLE "chat" DROP CONSTRAINT "chat_created_by_fk"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9a5f2493e2c02490ceb527649e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f60265ed6da63600bad2c5ee8c"`);
        await queryRunner.query(`DROP TABLE "chat_users"`);
        await queryRunner.query(`DROP TABLE "message"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "chat"`);
    }

}

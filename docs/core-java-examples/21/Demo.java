import java.io.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.function.*;
import java.util.regex.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.sql.*;

public class Demo {
    static class Account {
        final String owner;
        Account(String owner) {
            this.owner = Objects.requireNonNull(owner);
        }
    }

    public static void main(String[] args) throws Exception {
        Account account = new Account("Anil");
        System.out.println(account.owner);
    }
}
